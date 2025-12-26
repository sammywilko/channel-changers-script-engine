/**
 * Supabase Client Configuration
 * Channel Changers Script Engine
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ajsbopbuejhhaxwtbbku.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Tenant ID for multi-tenant isolation
export const TENANT_ID = 'cc-internal-001';
export const DEFAULT_OWNER = 'sam@channelchangers.co';

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Create Supabase client (or null if not configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false, // We're not using Supabase auth, just the database
      },
    })
  : null;

// Log configuration status (dev only)
if (import.meta.env.DEV) {
  if (isSupabaseConfigured) {
    console.log('✅ Supabase configured:', SUPABASE_URL);
  } else {
    console.warn('⚠️ Supabase not configured. Cloud sync disabled. Add VITE_SUPABASE_ANON_KEY to .env.local');
  }
}
