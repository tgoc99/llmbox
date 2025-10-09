/**
 * Configuration module for accessing environment variables
 * All environment variables should be accessed through this module
 */

/**
 * Get environment variable with optional default
 */
const getEnvVar = (name: string, required: boolean, defaultValue?: string): string => {
  const value = Deno.env.get(name);

  if (!value && required) {
    throw new Error(`Required environment variable ${name} is not set`);
  }

  return value || defaultValue || '';
};

/**
 * Application configuration object
 * Uses getters to read environment variables dynamically for testing
 */
export const config = {
  /** SendGrid API key for sending emails */
  get sendgridApiKey(): string {
    return getEnvVar('SENDGRID_API_KEY', false);
  },

  /** SendGrid webhook verification key */
  get sendgridWebhookVerificationKey(): string {
    return getEnvVar('SENDGRID_WEBHOOK_VERIFICATION_KEY', false);
  },

  /** SendGrid API timeout in milliseconds */
  get sendgridTimeoutMs(): number {
    return parseInt(getEnvVar('SENDGRID_TIMEOUT_MS', false, '10000'), 10);
  },

  /** OpenAI API key for LLM processing */
  get openaiApiKey(): string {
    return getEnvVar('OPENAI_API_KEY', false);
  },

  /** OpenAI model to use (default: gpt-4o-mini for better performance and cost efficiency) */
  get openaiModel(): string {
    return getEnvVar('OPENAI_MODEL', false, 'gpt-4o-mini');
  },

  /** OpenAI API timeout in milliseconds */
  get openaiTimeoutMs(): number {
    return parseInt(getEnvVar('OPENAI_TIMEOUT_MS', false, '30000'), 10);
  },

  /** OpenAI max tokens for response */
  get openaiMaxTokens(): number {
    return parseInt(getEnvVar('OPENAI_MAX_TOKENS', false, '2000'), 10);
  },

  /** OpenAI temperature (0.0 - 2.0) */
  get openaiTemperature(): number {
    return parseFloat(getEnvVar('OPENAI_TEMPERATURE', false, '0.7'));
  },

  /** Enable web search tool for OpenAI (default: true) */
  get enableWebSearch(): boolean {
    return getEnvVar('ENABLE_WEB_SEARCH', false, 'true').toLowerCase() === 'true';
  },

  /** Service email address for outbound emails */
  get serviceEmailAddress(): string {
    return getEnvVar('SERVICE_EMAIL_ADDRESS', false);
  },

  /** Logging level (DEBUG, INFO, WARN, ERROR, CRITICAL) */
  get logLevel(): string {
    return getEnvVar('LOG_LEVEL', false, 'INFO');
  },

  // Personifeed-specific configuration

  /** Personifeed email domain for newsletters (e.g., mail.llmbox.pro) */
  get personifeedEmailDomain(): string {
    return getEnvVar('PERSONIFEED_EMAIL_DOMAIN', false, 'mail.llmbox.pro');
  },

  /** Supabase URL */
  get supabaseUrl(): string {
    return getEnvVar('SUPABASE_URL', true);
  },

  /** Supabase service role key (for database access) */
  get supabaseServiceRoleKey(): string {
    return getEnvVar('SUPABASE_SERVICE_ROLE_KEY', true);
  },
};

