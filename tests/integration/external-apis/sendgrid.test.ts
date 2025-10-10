/**
 * Integration test with real SendGrid API
 * Note: This test requires SENDGRID_API_KEY and SERVICE_EMAIL_ADDRESS to be set
 * Note: This test sends real emails to the configured test recipient
 *
 * Run with: deno test tests/integration/sendgrid.test.ts --allow-all --allow-env
 */

import { assert, assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  formatReplyEmail as formatOutgoingEmail,
  sendReplyEmail as sendEmail,
} from '../../../supabase/functions/_shared/emailSender.ts';
import type {
  IncomingEmail,
  LLMResponse,
  OutgoingEmail,
} from '../../../supabase/functions/_shared/types.ts';

/**
 * Check if SendGrid credentials are available
 */
const hasCredentials = (): boolean => {
  const apiKey = Deno.env.get('SENDGRID_API_KEY');
  const serviceEmail = Deno.env.get('SERVICE_EMAIL_ADDRESS');
  return apiKey !== undefined && apiKey.length > 0 &&
    serviceEmail !== undefined && serviceEmail.length > 0;
};

/**
 * Get test recipient email (defaults to service email if not specified)
 */
const getTestRecipient = (): string => {
  return Deno.env.get('TEST_RECIPIENT_EMAIL') ||
    Deno.env.get('SERVICE_EMAIL_ADDRESS') ||
    'test@example.com';
};

/**
 * Create test outgoing email
 */
const createTestEmail = (overrides?: Partial<OutgoingEmail>): OutgoingEmail => {
  const serviceEmail = Deno.env.get('SERVICE_EMAIL_ADDRESS') || 'test@example.com';
  const testRecipient = getTestRecipient();

  return {
    from: serviceEmail,
    to: testRecipient,
    subject: 'Re: Integration Test',
    body: `This is a test email from the SendGrid integration test.\n\nTimestamp: ${
      new Date().toISOString()
    }`,
    inReplyTo: '<test-integration@example.com>',
    references: ['<test-integration@example.com>'],
    ...overrides,
  };
};

Deno.test({
  name: 'SendGrid integration - sends basic email successfully',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    // Arrange
    const testEmail = createTestEmail({
      subject: 'Re: Basic Integration Test',
      body: 'Hello! This is a basic test email to verify SendGrid integration is working.\n\n' +
        'Test ID: basic-' + Date.now(),
    });

    // Act
    let error: Error | null = null;
    try {
      await sendEmail(testEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(
      error,
      null,
      `SendEmail should complete without errors, but got: ${error?.message}`,
    );

    console.log('✅ SendGrid basic email test passed');
    console.log(`   Recipient: ${testEmail.to}`);
    console.log(`   Subject: ${testEmail.subject}`);
    console.log('   Check the recipient inbox to verify delivery');
  },
});

Deno.test({
  name: 'SendGrid integration - sends email with reply threading',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    // Arrange - Email with proper threading headers
    const testEmail = createTestEmail({
      subject: 'Re: Threading Test',
      body: 'This email tests proper email threading with In-Reply-To and References headers.\n\n' +
        'Test ID: threading-' + Date.now(),
      inReplyTo: '<original-message-id@example.com>',
      references: [
        '<thread-root@example.com>',
        '<previous-message@example.com>',
        '<original-message-id@example.com>',
      ],
    });

    // Act
    let error: Error | null = null;
    try {
      await sendEmail(testEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null, `Email with threading should send successfully: ${error?.message}`);

    console.log('✅ SendGrid threading test passed');
    console.log(`   References count: ${testEmail.references.length}`);
  },
});

Deno.test({
  name: 'SendGrid integration - sends email with long body',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    // Arrange - Email with long, multi-paragraph body
    const longBody = `Hello,

Thank you for your inquiry about our email assistant service. I'm happy to provide you with detailed information.

Our service uses advanced AI technology to automatically respond to emails. Here are some key features:

1. Natural Language Processing: The AI understands context and can respond appropriately to various types of inquiries.

2. Email Threading: Responses maintain proper email threading so conversations stay organized.

3. Fast Response Times: Most emails are processed and responded to within seconds.

4. Reliable Delivery: We use SendGrid for email delivery, ensuring high deliverability rates.

5. Customizable: You can configure the AI's behavior and response style to match your needs.

If you have any specific questions about features, pricing, or implementation, please don't hesitate to ask!

Best regards,
The Email Assistant Team

---
Test ID: long-body-${Date.now()}
This is an automated test email.`;

    const testEmail = createTestEmail({
      subject: 'Re: Detailed Information Request',
      body: longBody,
    });

    // Act
    let error: Error | null = null;
    try {
      await sendEmail(testEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null, `Long email should send successfully: ${error?.message}`);

    console.log('✅ SendGrid long body test passed');
    console.log(`   Body length: ${testEmail.body.length} characters`);
    console.log(`   Paragraphs: ${testEmail.body.split('\n\n').length}`);
  },
});

Deno.test({
  name: 'SendGrid integration - sends email with special characters',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    // Arrange - Email with special characters and emojis
    const testEmail = createTestEmail({
      subject: 'Re: Test émojis & spëcial çhars ✨',
      body: `Hello! 🎉

Thank you for your message. Here's some information with special characters:

• Pricing: $100-$200/month (€85-€170)
• Discounts: 10%-50% off for annual plans 💰
• Languages: English, Español, Français, Deutsch, 日本語
• Support: 24/7 availability ⏰

Special symbols: © ® ™ § ¶ † ‡ • ◦ ‣ ⁃

Math: ± × ÷ ≈ ≠ ≤ ≥ ∞

Feel free to reach out if you have questions! 😊

Test ID: special-chars-${Date.now()}`,
    });

    // Act
    let error: Error | null = null;
    try {
      await sendEmail(testEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(
      error,
      null,
      `Email with special chars should send successfully: ${error?.message}`,
    );

    console.log('✅ SendGrid special characters test passed');
    console.log('   Email contained emojis, accents, and special symbols');
  },
});

Deno.test({
  name: 'SendGrid integration - formats outgoing email correctly',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    // Arrange - Incoming email and LLM response
    const incomingEmail: IncomingEmail = {
      from: getTestRecipient(),
      to: Deno.env.get('SERVICE_EMAIL_ADDRESS') || 'test@example.com',
      subject: 'Question about your service',
      body: 'Hi, can you tell me more about your pricing?',
      messageId: '<incoming-123@example.com>',
      inReplyTo: null,
      references: [],
      timestamp: new Date(),
    };

    const llmResponse: LLMResponse = {
      content: 'Thank you for your question! Our pricing starts at $50/month for basic plans.',
      model: 'gpt-4o-mini',
      tokenCount: 25,
      completionTime: 1500,
    };

    // Act - Format the outgoing email
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    // Assert - Check formatting
    assertExists(outgoingEmail);
    assertEquals(outgoingEmail.from, incomingEmail.to, 'From should be service email');
    assertEquals(outgoingEmail.to, incomingEmail.from, 'To should be original sender');
    assert(outgoingEmail.subject.startsWith('Re: '), 'Subject should have Re: prefix');
    assertEquals(outgoingEmail.body, llmResponse.content, 'Body should be LLM response');
    assertEquals(
      outgoingEmail.inReplyTo,
      incomingEmail.messageId,
      'InReplyTo should be original message ID',
    );
    assert(
      outgoingEmail.references.includes(incomingEmail.messageId),
      'References should include original message ID',
    );

    // Act - Send the formatted email
    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert - Email sent successfully
    assertEquals(error, null, `Formatted email should send successfully: ${error?.message}`);

    console.log('✅ SendGrid formatting test passed');
    console.log(`   Original subject: "${incomingEmail.subject}"`);
    console.log(`   Reply subject: "${outgoingEmail.subject}"`);
  },
});

Deno.test({
  name: 'SendGrid integration - handles subject with existing Re: prefix',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    // Arrange - Incoming email that already has Re: prefix
    const incomingEmail: IncomingEmail = {
      from: getTestRecipient(),
      to: Deno.env.get('SERVICE_EMAIL_ADDRESS') || 'test@example.com',
      subject: 'Re: Previous conversation',
      body: 'Following up on our previous discussion.',
      messageId: '<followup-456@example.com>',
      inReplyTo: '<original-789@example.com>',
      references: ['<original-789@example.com>'],
      timestamp: new Date(),
    };

    const llmResponse: LLMResponse = {
      content: "Thank you for following up! Here's the information you requested.",
      model: 'gpt-4o-mini',
      tokenCount: 20,
      completionTime: 1200,
    };

    // Act - Format the outgoing email
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    // Assert - Should not duplicate Re: prefix
    assertEquals(
      outgoingEmail.subject,
      'Re: Previous conversation',
      'Should not duplicate Re: prefix',
    );
    assert(
      outgoingEmail.references.length === 2,
      'Should append new message ID to references',
    );

    // Act - Send the email
    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null, `Email should send successfully: ${error?.message}`);

    console.log('✅ SendGrid Re: prefix test passed');
    console.log(`   Subject: "${outgoingEmail.subject}" (no duplicate Re:)`);
  },
});

Deno.test({
  name: 'SendGrid integration - sends multiple emails sequentially',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    const testId = Date.now();
    const emailCount = 3;
    const errors: Error[] = [];

    // Act - Send multiple emails
    for (let i = 1; i <= emailCount; i++) {
      const testEmail = createTestEmail({
        subject: `Re: Batch Test ${i} of ${emailCount}`,
        body:
          `This is test email ${i} of ${emailCount}.\n\nBatch ID: batch-${testId}\nEmail ID: ${i}`,
        inReplyTo: `<batch-${testId}-original@example.com>`,
      });

      try {
        await sendEmail(testEmail);
        console.log(`   ✓ Email ${i}/${emailCount} sent successfully`);
      } catch (err) {
        errors.push(err as Error);
        console.log(`   ✗ Email ${i}/${emailCount} failed: ${(err as Error).message}`);
      }
    }

    // Assert - All emails should send successfully
    assertEquals(
      errors.length,
      0,
      `All emails should send successfully. Errors: ${errors.map((e) => e.message).join(', ')}`,
    );

    console.log('✅ SendGrid batch test passed');
    console.log(`   Successfully sent ${emailCount} emails`);
  },
});

Deno.test({
  name: 'SendGrid integration - timing and performance',
  ignore: !hasCredentials(),
  async fn() {
    if (!hasCredentials()) {
      console.log('⏭️  Skipping SendGrid integration test - credentials not set');
      return;
    }

    // Arrange
    const testEmail = createTestEmail({
      subject: 'Re: Performance Test',
      body: `Testing SendGrid API response time.\n\nTest ID: performance-${Date.now()}`,
    });

    const startTime = Date.now();

    // Act
    let error: Error | null = null;
    try {
      await sendEmail(testEmail);
    } catch (err) {
      error = err as Error;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Assert
    assertEquals(error, null, `Email should send successfully: ${error?.message}`);
    assert(duration < 10000, `Email should send within 10 seconds, took ${duration}ms`);

    console.log('✅ SendGrid performance test passed');
    console.log(`   Send duration: ${duration}ms`);
    console.log(`   Status: ${duration < 5000 ? 'Fast' : duration < 8000 ? 'Normal' : 'Slow'}`);
  },
});

// Test helper output for skipped tests
if (!hasCredentials()) {
  console.log('\n⚠️  SendGrid Integration Tests Skipped');
  console.log('   Set required environment variables to run these tests:');
  console.log('   - SENDGRID_API_KEY=your_api_key');
  console.log('   - SERVICE_EMAIL_ADDRESS=your_service_email@domain.com');
  console.log(
    '   - TEST_RECIPIENT_EMAIL=test_recipient@domain.com (optional, defaults to service email)',
  );
  console.log(
    '   Then run: deno test tests/integration/sendgrid.test.ts --allow-all --allow-env\n',
  );
}
