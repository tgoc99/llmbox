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
  /** Time taken to generate response (milliseconds) */
  completionTime: number;
}

// Personifeed-specific types

/**
 * User entity from database
 */
export interface User {
  id: string;
  email: string;
  created_at: Date;
  active: boolean;
}

/**
 * Customization entity from database
 */
export interface Customization {
  id: string;
  user_id: string;
  content: string;
  type: 'initial' | 'feedback';
  created_at: Date;
}

/**
 * Newsletter entity from database
 */
export interface Newsletter {
  id: string;
  user_id: string;
  content: string;
  sent_at: Date | null;
  status: 'pending' | 'sent' | 'failed';
  created_at: Date;
}

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
