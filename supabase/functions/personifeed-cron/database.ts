/**
 * Database access layer for personifeed-cron function
 */

import { getSupabaseClient } from '../_shared/supabaseClient.ts';
import type { Customization, Newsletter, User } from '../_shared/types.ts';
import { DatabaseError } from '../_shared/errors.ts';
import { logError, logInfo } from '../_shared/logger.ts';

/**
 * Get all active users
 */
export const getAllActiveUsers = async (): Promise<User[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    logError('database_query_failed', {
      operation: 'getAllActiveUsers',
      error: error.message,
    });
    throw new DatabaseError('Failed to fetch active users', { error: error.message });
  }

  return (data as User[]) || [];
};

/**
 * Get all customizations for a user
 */
export const getUserCustomizations = async (userId: string): Promise<Customization[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('customizations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    logError('database_query_failed', {
      operation: 'getUserCustomizations',
      userId,
      error: error.message,
    });
    throw new DatabaseError('Failed to fetch user customizations', {
      userId,
      error: error.message,
    });
  }

  return (data as Customization[]) || [];
};

/**
 * Create newsletter record
 */
export const createNewsletter = async (
  userId: string,
  content: string,
  status: 'pending' | 'sent' | 'failed',
): Promise<Newsletter> => {
  const supabase = getSupabaseClient();

  const newsletterData: {
    user_id: string;
    content: string;
    status: string;
    sent_at?: string;
  } = {
    user_id: userId,
    content,
    status,
  };

  // Add sent_at timestamp if status is 'sent'
  if (status === 'sent') {
    newsletterData.sent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('newsletters')
    .insert(newsletterData)
    .select()
    .single();

  if (error) {
    logError('database_insert_failed', {
      operation: 'createNewsletter',
      userId,
      error: error.message,
    });
    throw new DatabaseError('Failed to create newsletter', {
      userId,
      error: error.message,
    });
  }

  return data as Newsletter;
};

/**
 * Update newsletter status
 */
export const updateNewsletterStatus = async (
  newsletterId: string,
  status: 'sent' | 'failed',
): Promise<void> => {
  const supabase = getSupabaseClient();

  const updateData: {
    status: string;
    sent_at?: string;
  } = { status };

  // Add sent_at timestamp if status is 'sent'
  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('newsletters')
    .update(updateData)
    .eq('id', newsletterId);

  if (error) {
    logError('database_update_failed', {
      operation: 'updateNewsletterStatus',
      newsletterId,
      status,
      error: error.message,
    });
    throw new DatabaseError('Failed to update newsletter status', {
      newsletterId,
      status,
      error: error.message,
    });
  }

  logInfo('newsletter_status_updated', { newsletterId, status });
};
