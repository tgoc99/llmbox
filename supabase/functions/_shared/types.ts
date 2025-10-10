/**
 * Shared type definitions
 */

/**
 * Incoming email parsed from SendGrid webhook
 */
export interface IncomingEmail {
  /** Sender email address */
  from: string;
  /** Recipient email address (service address) */
  to: string;
  /** Email subject line */
  subject: string;
  /** Plain text email body */
  body: string;
  /** Unique message identifier from headers */
  messageId: string;
  /** Message-ID this email replies to (null if not a reply) */
  inReplyTo: string | null;
  /** Chain of message IDs in conversation thread */
  references: string[];
  /** When email was received */
  timestamp: Date;
}

/**
 * SendGrid webhook payload structure
 * Note: SendGrid sends multipart/form-data with these fields
 */
export interface SendGridWebhookPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  headers: string;
  html?: string;
  attachments?: string;
}

/**
 * Outgoing email to be sent via SendGrid
 */
export interface OutgoingEmail {
  /** Service email address (sender) */
  from: string;
  /** Recipient email address (original sender) */
  to: string;
  /** Email subject with "Re: " prefix */
  subject: string;
  /** Response content from LLM (plain text or markdown) */
  body: string;
  /** HTML version of body (optional) */
  htmlBody?: string;
  /** Original message ID this email replies to */
  inReplyTo: string;
  /** Updated thread references */
  references: string[];
}

/**
 * LLM response from OpenAI API
 */
export interface LLMResponse {
  /** Generated response text */
  content: string;
  /** Model used (e.g., "gpt-4", "gpt-3.5-turbo") */
  model: string;
  /** Total tokens used in generation */
  tokenCount: number;
  /** Prompt tokens used */
  promptTokens: number;
  /** Completion tokens used */
  completionTokens: number;
  /** Time taken to generate response (milliseconds) */
  completionTime: number;
}

// ============================================================================
// Database Types (Unified Multi-Product Architecture)
// ============================================================================

/**
 * User entity from database (centralized across all products)
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * Product entity from database
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  subdomain: string;
  status: 'active' | 'beta' | 'deprecated';
  created_at: string;
}

/**
 * User-Product relationship with settings
 */
export interface UserProduct {
  user_id: string;
  product_id: string;
  status: 'active' | 'paused' | 'unsubscribed';
  settings: Record<string, unknown>; // JSONB - product-specific settings
  created_at: string;
  updated_at: string;
}

/**
 * Personifeed settings stored in user_products.settings
 */
export interface PersonifeedSettings {
  topics?: string[];
  preferred_time?: string; // HH:MM format
  timezone?: string;
  initialPrompt?: string; // User's initial interests
  feedbacks?: string[]; // User feedback from replies
}

/**
 * Email log entry from database
 */
export interface Email {
  id: string;
  user_id: string | null;
  product_id: string;
  direction: 'incoming' | 'outgoing';
  type: EmailType;
  from_email: string;
  to_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  thread_id: string | null;
  in_reply_to: string | null;
  references: string[] | null;
  external_id: string | null;
  raw_headers: Record<string, unknown> | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
}

/**
 * Email types across all products
 */
export type EmailType =
  | 'llm_query'
  | 'llm_response'
  | 'newsletter_scheduled'
  | 'reply_received'
  | 'customization_update'
  | 'other';

/**
 * AI token usage tracking
 */
export interface AITokenUsage {
  id: string;
  user_id: string | null;
  product_id: string;
  operation_type: AIOperationType;
  email_id: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_cents: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * AI operation types
 */
export type AIOperationType =
  | 'llm_chat'
  | 'newsletter_generate'
  | 'content_summarize'
  | 'other';

// ============================================================================
// Personifeed-Specific Types
// ============================================================================

/**
 * Signup request from landing page
 */
export interface SignupRequest {
  email: string;
  initialPrompt: string;
}

/**
 * Signup response
 */
export interface SignupResponse {
  success: boolean;
  message: string;
  userId?: string;
}
