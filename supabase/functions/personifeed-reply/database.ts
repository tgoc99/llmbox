/**
 * Database access layer for personifeed-reply function
 */

import { getSupabaseClient } from '../_shared/supabaseClient.ts';
import type { User, Customization } from '../_shared/types.ts';
import { DatabaseError } from '../_shared/errors.ts';
import { logInfo, logError } from '../_shared/logger.ts';

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logError('database_query_failed', {
      operation: 'getUserById',
      userId,
      error: error.message,
    });
    throw new DatabaseError('Failed to query user by ID', { userId, error: error.message });
  }

  return data as User | null;
};

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
 * Add feedback customization for user
 */
export const addFeedback = async (userId: string, content: string): Promise<Customization> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('customizations')
    .insert({
      user_id: userId,
      content,
      type: 'feedback',
    })
    .select()
    .single();

  if (error) {
    logError('database_insert_failed', {
      operation: 'addFeedback',
      userId,
      error: error.message,
    });
    throw new DatabaseError('Failed to add feedback', {
      userId,
      error: error.message,
    });
  }

  logInfo('feedback_added', {
    customizationId: data.id,
    userId,
    contentLength: content.length,
  });

  return data as Customization;
};

/**
 * Add initial customization for new user (created from reply)
 */
export const addInitialCustomization = async (
  userId: string,
  content: string,
): Promise<Customization> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('customizations')
    .insert({
      user_id: userId,
      content,
      type: 'initial',
    })
    .select()
    .single();

  if (error) {
    logError('database_insert_failed', {
      operation: 'addInitialCustomization',
      userId,
      error: error.message,
    });
    throw new DatabaseError('Failed to add initial customization', {
      userId,
      error: error.message,
    });
  }

  logInfo('initial_customization_added', {
    customizationId: data.id,
    userId,
    contentLength: content.length,
  });

  return data as Customization;
};

