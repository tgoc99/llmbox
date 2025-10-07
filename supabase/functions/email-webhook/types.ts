/**
 * Type definitions for email webhook processing
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

/**
 * OpenAI Chat Completions API request structure
 */
export interface OpenAICompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'developer';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

/**
 * OpenAI Chat Completions API response structure
 */
export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      refusal?: string | null;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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
  /** Response content from LLM */
  body: string;
  /** Original message ID this email replies to */
  inReplyTo: string;
  /** Updated thread references */
  references: string[];
}

/**
 * SendGrid Send API request structure
 */
export interface SendGridEmailRequest {
  personalizations: Array<{
    to: Array<{ email: string }>;
    subject: string;
    headers?: Record<string, string>;
  }>;
  from: { email: string };
  content: Array<{
    type: string;
    value: string;
  }>;
}

/**
 * SendGrid Send API response structure
 */
export interface SendGridEmailResponse {
  /** HTTP status code */
  statusCode: number;
  /** Response body (typically empty on success) */
  body?: string;
  /** Response headers */
  headers?: Record<string, string>;
}
