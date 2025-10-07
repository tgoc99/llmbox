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
 * Note: OpenAI API request/response structures are now handled
 * by the official npm:openai library (openai@6.2.0)
 * We use the Responses API which provides a simpler interface:
 * - Input: Simple string input instead of messages array
 * - Output: response.output_text for the generated text
 * - Tools: Built-in web_search_preview support
 * No custom interfaces needed for OpenAI API interactions
 */

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
 * Note: SendGrid Send API request/response structures are now handled
 * by the official @sendgrid/mail library (npm:@sendgrid/mail@8.1.6)
 * No custom interfaces needed for SendGrid API interactions
 * 
 * Note: OpenAI API structures are handled by npm:openai@6.2.0
 * Using Responses API for simpler interface with built-in web search
 */
