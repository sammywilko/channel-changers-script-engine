/**
 * Mention Service - Cross-App Asset References
 * Enables @mentions for characters, locations, styles, products across CC apps
 */

import { supabase, TENANT_ID } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

export type AssetType = 'character' | 'location' | 'style' | 'product' | 'project';
export type SourceApp = 'design-agent' | 'script-engine' | 'director' | 'marketing-suite';

export interface ReferenceImage {
  url: string;
  type: 'reference' | 'generated' | 'uploaded';
  label?: string;
}

export interface SharedAsset {
  id: string;
  tenant_id: string;
  asset_type: AssetType;
  handle: string;           // @SamWilkinson, @LondonStudio
  name: string;             // Sam Wilkinson, London Studio
  source_app: SourceApp;
  source_project_id?: string;
  description?: string;
  reference_images: ReferenceImage[];
  metadata: Record<string, any>;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetMention {
  id: string;
  asset_id: string;
  app: SourceApp;
  project_id: string;
  context?: string;         // 'beat', 'scene', 'post'
  context_id?: string;
  created_at: string;
}

export interface CreateAssetInput {
  asset_type: AssetType;
  handle: string;
  name: string;
  source_app: SourceApp;
  source_project_id?: string;
  description?: string;
  reference_images?: ReferenceImage[];
  metadata?: Record<string, any>;
}

// ============================================
// MENTION SERVICE
// ============================================

export const mentionService = {
  /**
   * Search assets by handle or name (for autocomplete)
   */
  async search(query: string, type?: AssetType): Promise<SharedAsset[]> {
    if (!supabase) return [];

    try {
      let queryBuilder = supabase
        .from('shared_assets')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .or(`handle.ilike.%${query}%,name.ilike.%${query}%`);

      if (type) {
        queryBuilder = queryBuilder.eq('asset_type', type);
      }

      const { data, error } = await queryBuilder
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to search assets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search assets:', error);
      return [];
    }
  },

  /**
   * Get asset by handle (exact match)
   */
  async getByHandle(handle: string): Promise<SharedAsset | null> {
    if (!supabase) return null;

    try {
      // Normalize handle (remove @ if present)
      const normalizedHandle = handle.startsWith('@') ? handle.slice(1) : handle;

      const { data, error } = await supabase
        .from('shared_assets')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('handle', normalizedHandle)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not "no rows" error
          console.error('Failed to get asset by handle:', error);
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get asset by handle:', error);
      return null;
    }
  },

  /**
   * Get asset by ID
   */
  async getById(id: string): Promise<SharedAsset | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('shared_assets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get asset by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get asset by ID:', error);
      return null;
    }
  },

  /**
   * Get all assets by type
   */
  async getByType(type: AssetType): Promise<SharedAsset[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('shared_assets')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('asset_type', type)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Failed to get assets by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get assets by type:', error);
      return [];
    }
  },

  /**
   * Convenience methods for common types
   */
  async getCharacters(): Promise<SharedAsset[]> {
    return this.getByType('character');
  },

  async getLocations(): Promise<SharedAsset[]> {
    return this.getByType('location');
  },

  async getStyles(): Promise<SharedAsset[]> {
    return this.getByType('style');
  },

  async getProducts(): Promise<SharedAsset[]> {
    return this.getByType('product');
  },

  /**
   * Create or update an asset
   */
  async upsert(input: CreateAssetInput): Promise<SharedAsset | null> {
    if (!supabase) return null;

    try {
      // Normalize handle
      const handle = input.handle.startsWith('@')
        ? input.handle.slice(1)
        : input.handle;

      const { data, error } = await supabase
        .from('shared_assets')
        .upsert({
          tenant_id: TENANT_ID,
          asset_type: input.asset_type,
          handle,
          name: input.name,
          source_app: input.source_app,
          source_project_id: input.source_project_id || null,
          description: input.description || null,
          reference_images: input.reference_images || [],
          metadata: input.metadata || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tenant_id,handle'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to upsert asset:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to upsert asset:', error);
      return null;
    }
  },

  /**
   * Delete an asset
   */
  async delete(id: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('shared_assets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete asset:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete asset:', error);
      return false;
    }
  },

  /**
   * Record a mention (tracks where assets are used)
   */
  async recordMention(
    assetId: string,
    app: SourceApp,
    projectId: string,
    context?: string,
    contextId?: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      // Insert mention record
      const { error: mentionError } = await supabase
        .from('asset_mentions')
        .insert({
          asset_id: assetId,
          app,
          project_id: projectId,
          context: context || null,
          context_id: contextId || null
        });

      if (mentionError) {
        console.error('Failed to record mention:', mentionError);
        return false;
      }

      // Increment usage count
      const { error: rpcError } = await supabase
        .rpc('increment_asset_usage', { p_asset_id: assetId });

      if (rpcError) {
        console.error('Failed to increment usage count:', rpcError);
        // Don't fail the whole operation
      }

      return true;
    } catch (error) {
      console.error('Failed to record mention:', error);
      return false;
    }
  },

  /**
   * Get mentions for an asset
   */
  async getMentions(assetId: string): Promise<AssetMention[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('asset_mentions')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get mentions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get mentions:', error);
      return [];
    }
  },

  /**
   * Parse @mentions from text and return matched assets
   */
  async parseAndResolve(text: string): Promise<{ text: string; mentions: SharedAsset[] }> {
    const mentionPattern = /@(\w+)/g;
    const handles = [...text.matchAll(mentionPattern)].map(m => m[1]);

    if (handles.length === 0) {
      return { text, mentions: [] };
    }

    const mentions: SharedAsset[] = [];

    for (const handle of handles) {
      const asset = await this.getByHandle(handle);
      if (asset) {
        mentions.push(asset);
      }
    }

    return { text, mentions };
  },

  /**
   * Generate a valid handle from a name
   */
  generateHandle(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }
};

// Export types for use in components
export type { SharedAsset, AssetMention, CreateAssetInput };
