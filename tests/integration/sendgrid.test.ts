/**
 * Integration test with real SendGrid API
 * Note: This test requires SENDGRID_API_KEY and SERVICE_EMAIL_ADDRESS to be set
 * Note: This test sends a real email to the configured test recipient
 */

import { assertEquals } from 'jsr:@std/assert';
import { sendEmail } from '../../supabase/functions/email-webhook/emailSender.ts';
import type { OutgoingEmail } from '../../supabase/functions/email-webhook/types.ts';

Deno.test({
  name: 'sendEmail - integration test with real SendGrid API',
  ignore: !Deno.env.get('SENDGRID_API_KEY') || !Deno.env.get('SERVICE_EMAIL_ADDRESS'),
  async fn() {
    // Check for required environment variables
    const apiKey = Deno.env.get('SENDGRID_API_KEY');
    const serviceEmail = Deno.env.get('SERVICE_EMAIL_ADDRESS');
    const testRecipient = Deno.env.get('TEST_RECIPIENT_EMAIL') || serviceEmail;

    if (!apiKey || !serviceEmail) {
      console.log('Skipping integration test: SENDGRID_API_KEY or SERVICE_EMAIL_ADDRESS not set');
      return;
    }

    // Create test email
    const testEmail: OutgoingEmail = {
      from: serviceEmail,
      to: testRecipient!,
      subject: 'Re: Integration Test',
      body: 'This is a test email from the SendGrid integration test.\n\nTimestamp: ' +
        new Date().toISOString(),
      inReplyTo: '<test-integration@example.com>',
      references: ['<test-integration@example.com>'],
    };

    // Send email
    let error: Error | null = null;
    try {
      await sendEmail(testEmail);
    } catch (err) {
      error = err as Error;
    }

    // Verify no error occurred
    assertEquals(error, null, `SendEmail should complete without errors, but got: ${error?.message}`);

    console.log('✓ Integration test email sent successfully');
    console.log(`  Recipient: ${testRecipient}`);
    console.log(`  Subject: ${testEmail.subject}`);
    console.log('  Check the recipient inbox to verify delivery');
  },
});

