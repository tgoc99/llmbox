/**
 * Supabase client helper for database access
 */

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { config } from './config.ts';

/**
 * Create Supabase client with service role key
 * WARNING: This client has elevated permissions and bypasses RLS
 */
export const createServiceRoleClient = (): SupabaseClient => {
  return createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
};

/**
 * Singleton Supabase client instance
 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createServiceRoleClient();
  }
  return supabaseInstance;
};

