/**
 * Supabase Sync Service
 * Channel Changers Script Engine
 *
 * Handles cloud synchronization of script projects to Supabase.
 * Works alongside localStorage for offline-first experience.
 */

import { supabase, isSupabaseConfigured, TENANT_ID, DEFAULT_OWNER } from '../lib/supabase';
import type { ProjectState, ProjectData, Snapshot } from '../types';

// Debounce timer reference
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000; // 2 seconds

// Sync status for UI feedback
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  error: string | null;
}

export interface ProjectListItem {
  id: string;
  title: string;
  logline: string | null;
  currentPhase: number;
  updatedAt: Date;
  createdAt: Date;
}

// Database row type
interface ProjectRow {
  id: string;
  tenant_id: string;
  owner_email: string;
  title: string;
  logline: string | null;
  format: string | null;
  tone: string | null;
  characters: string[];
  character_profiles: Array<{ name: string; archetype?: string; dialogueDNA?: string }>;
  locations: string[];
  beats: string[];
  script_content: string;
  scenes_written: number;
  production_notes: string[];
  visuals: Array<{ id: string; type: string; data: string; label: string; timestamp: number }>;
  current_phase: number;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

/**
 * Convert ProjectState to database row format
 */
function toDbRow(projectId: string, state: ProjectState): Partial<ProjectRow> {
  return {
    id: projectId,
    tenant_id: TENANT_ID,
    owner_email: DEFAULT_OWNER,
    title: state.data.title || 'Untitled Project',
    logline: state.data.logline || null,
    format: state.data.format || null,
    tone: state.data.tone || null,
    characters: state.data.characters || [],
    character_profiles: state.data.characterProfiles || [],
    locations: state.data.locations || [],
    beats: state.data.beats || [],
    script_content: state.data.scriptContent || '',
    scenes_written: state.data.scenesWritten || 0,
    production_notes: state.data.productionNotes || [],
    visuals: state.data.visuals || [],
    current_phase: state.currentPhase,
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Convert database row to ProjectState
 */
function fromDbRow(row: ProjectRow): ProjectState {
  return {
    currentPhase: row.current_phase,
    data: {
      title: row.title,
      logline: row.logline || '',
      format: row.format || '',
      tone: row.tone || '',
      characters: row.characters || [],
      characterProfiles: row.character_profiles || [],
      locations: row.locations || [],
      beats: row.beats || [],
      scriptContent: row.script_content || '',
      scenesWritten: row.scenes_written || 0,
      productionNotes: row.production_notes || [],
      snapshots: [], // Loaded separately
      visuals: row.visuals || [],
    },
  };
}

/**
 * Sync project to Supabase (debounced)
 * Call this on every state change - it will debounce automatically
 */
export function syncProject(
  projectId: string,
  state: ProjectState,
  onStatusChange?: (status: SyncStatus) => void
): void {
  if (!isSupabaseConfigured || !supabase) {
    onStatusChange?.('offline');
    return;
  }

  // Clear existing timer
  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  // Set new debounced sync
  syncTimer = setTimeout(async () => {
    onStatusChange?.('syncing');

    try {
      const row = toDbRow(projectId, state);

      const { error } = await supabase
        .from('script_engine_projects')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.error('Sync error:', error);
        onStatusChange?.('error');
        return;
      }

      onStatusChange?.('synced');
      console.log('✅ Project synced to cloud:', projectId);
    } catch (err) {
      console.error('Sync exception:', err);
      onStatusChange?.('error');
    }
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Force immediate sync (for manual save button)
 */
export async function syncProjectNow(
  projectId: string,
  state: ProjectState
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Clear debounce timer
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  try {
    const row = toDbRow(projectId, state);

    const { error } = await supabase
      .from('script_engine_projects')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Load project from Supabase by ID
 */
export async function loadProject(
  projectId: string
): Promise<{ data: ProjectState | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('script_engine_projects')
      .select('*')
      .eq('id', projectId)
      .eq('tenant_id', TENANT_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - not an error, just no cloud version
        return { data: null };
      }
      return { data: null, error: error.message };
    }

    const state = fromDbRow(data as ProjectRow);

    // Load snapshots separately
    const { data: snapshots } = await supabase
      .from('script_engine_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (snapshots) {
      state.data.snapshots = snapshots.map((s) => ({
        id: s.id,
        timestamp: new Date(s.created_at).getTime(),
        label: s.label || '',
        data: s.data as ProjectData,
      }));
    }

    return { data: state };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * List all projects for this tenant
 */
export async function listProjects(): Promise<{
  data: ProjectListItem[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('script_engine_projects')
      .select('id, title, logline, current_phase, created_at, updated_at')
      .eq('tenant_id', TENANT_ID)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    const projects: ProjectListItem[] = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      logline: row.logline,
      currentPhase: row.current_phase,
      updatedAt: new Date(row.updated_at),
      createdAt: new Date(row.created_at),
    }));

    return { data: projects };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Create a new project in Supabase
 */
export async function createProject(
  title: string = 'Untitled Project'
): Promise<{ id: string | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { id: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('script_engine_projects')
      .insert({
        tenant_id: TENANT_ID,
        owner_email: DEFAULT_OWNER,
        title,
        current_phase: 1,
      })
      .select('id')
      .single();

    if (error) {
      return { id: null, error: error.message };
    }

    return { id: data.id };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Delete a project from Supabase
 */
export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('script_engine_projects')
      .delete()
      .eq('id', projectId)
      .eq('tenant_id', TENANT_ID);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Save a snapshot to Supabase
 */
export async function saveSnapshot(
  projectId: string,
  snapshot: Snapshot
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.from('script_engine_snapshots').insert({
      project_id: projectId,
      label: snapshot.label,
      data: snapshot.data,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Check if Supabase sync is available
 */
export function isSyncAvailable(): boolean {
  return isSupabaseConfigured;
}
