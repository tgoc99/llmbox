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
 */
export const config = {
  /** SendGrid API key for sending emails */
  sendgridApiKey: getEnvVar('SENDGRID_API_KEY', false),

  /** SendGrid webhook verification key */
  sendgridWebhookVerificationKey: getEnvVar('SENDGRID_WEBHOOK_VERIFICATION_KEY', false),

  /** SendGrid API timeout in milliseconds */
  sendgridTimeoutMs: parseInt(getEnvVar('SENDGRID_TIMEOUT_MS', false, '10000'), 10),

  /** OpenAI API key for LLM processing */
  openaiApiKey: getEnvVar('OPENAI_API_KEY', false),

  /** OpenAI model to use (default: gpt-3.5-turbo) */
  openaiModel: getEnvVar('OPENAI_MODEL', false, 'gpt-3.5-turbo'),

  /** OpenAI API timeout in milliseconds */
  openaiTimeoutMs: parseInt(getEnvVar('OPENAI_TIMEOUT_MS', false, '30000'), 10),

  /** OpenAI max tokens for response */
  openaiMaxTokens: parseInt(getEnvVar('OPENAI_MAX_TOKENS', false, '1000'), 10),

  /** OpenAI temperature (0.0 - 2.0) */
  openaiTemperature: parseFloat(getEnvVar('OPENAI_TEMPERATURE', false, '0.7')),

  /** Service email address for outbound emails */
  serviceEmailAddress: getEnvVar('SERVICE_EMAIL_ADDRESS', false),

  /** Logging level (DEBUG, INFO, WARN, ERROR, CRITICAL) */
  logLevel: getEnvVar('LOG_LEVEL', false, 'INFO'),
};

