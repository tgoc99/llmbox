/**
 * Database access layer for personifeed-signup function
 */

import { getSupabaseClient } from '../_shared/supabaseClient.ts';
import type { Customization, User } from '../_shared/types.ts';
import { DatabaseError } from '../_shared/errors.ts';
import { logError, logInfo } from '../_shared/logger.ts';

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    logError('database_query_failed', {
      operation: 'getUserByEmail',
      email,
      error: error.message,
    });
    throw new DatabaseError('Failed to query user', { email, error: error.message });
  }

  return data as User | null;
};

/**
 * Create new user
 */
export const createUser = async (email: string): Promise<User> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .insert({ email, active: true })
    .select()
    .single();

  if (error) {
    logError('database_insert_failed', {
      operation: 'createUser',
      email,
      error: error.message,
    });
    throw new DatabaseError('Failed to create user', { email, error: error.message });
  }

  logInfo('user_created', { userId: data.id, email });
  return data as User;
};

/**
 * Add customization for user
 */
export const addCustomization = async (
  userId: string,
  content: string,
  type: 'initial' | 'feedback',
): Promise<Customization> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('customizations')
    .insert({
      user_id: userId,
      content,
      type,
    })
    .select()
    .single();

  if (error) {
    logError('database_insert_failed', {
      operation: 'addCustomization',
      userId,
      type,
      error: error.message,
    });
    throw new DatabaseError('Failed to add customization', {
      userId,
      type,
      error: error.message,
    });
  }

  logInfo('customization_added', {
    customizationId: data.id,
    userId,
    type,
    contentLength: content.length,
  });

  return data as Customization;
};
