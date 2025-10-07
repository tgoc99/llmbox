/**
 * End-to-End Integration Test
 *
 * Tests the complete workflow: receive email -> generate AI response -> send reply
 * This test makes real API calls to both OpenAI and SendGrid
 *
 * Required environment variables:
 * - OPENAI_API_KEY
 * - SENDGRID_API_KEY
 * - SERVICE_EMAIL_ADDRESS
 * - TEST_RECIPIENT_EMAIL (optional)
 *
 * Run with: deno test tests/integration/end-to-end.test.ts --allow-all --allow-env
 */

import { assert, assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { generateResponse } from '../../supabase/functions/email-webhook/llmClient.ts';
import { sendEmail, formatOutgoingEmail } from '../../supabase/functions/email-webhook/emailSender.ts';
import type { IncomingEmail } from '../../supabase/functions/email-webhook/types.ts';

/**
 * Check if all required credentials are available
 */
const hasAllCredentials = (): boolean => {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const serviceEmail = Deno.env.get('SERVICE_EMAIL_ADDRESS');

  return openaiKey !== undefined && openaiKey.length > 0 &&
         sendgridKey !== undefined && sendgridKey.length > 0 &&
         serviceEmail !== undefined && serviceEmail.length > 0;
};

/**
 * Get test recipient email
 */
const getTestRecipient = (): string => {
  return Deno.env.get('TEST_RECIPIENT_EMAIL') ||
         Deno.env.get('SERVICE_EMAIL_ADDRESS') ||
         'test@example.com';
};

/**
 * Create test incoming email
 */
const createIncomingEmail = (overrides?: Partial<IncomingEmail>): IncomingEmail => {
  return {
    from: getTestRecipient(),
    to: Deno.env.get('SERVICE_EMAIL_ADDRESS') || 'test@example.com',
    subject: 'Test Question',
    body: 'Hello, I have a question about your service.',
    messageId: `<test-${Date.now()}@example.com>`,
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
    ...overrides,
  };
};

Deno.test({
  name: 'E2E integration - complete email response workflow',
  ignore: !hasAllCredentials(),
  async fn() {
    if (!hasAllCredentials()) {
      console.log('⏭️  Skipping E2E test - credentials not set');
      return;
    }

    // Arrange - Incoming email
    const incomingEmail = createIncomingEmail({
      subject: 'Question about pricing',
      body: 'Hi, I\'m interested in your email assistant service. Can you tell me about your pricing plans?',
      messageId: `<e2e-test-${Date.now()}@example.com>`,
    });

    console.log('📧 Step 1: Processing incoming email...');
    console.log(`   From: ${incomingEmail.from}`);
    console.log(`   Subject: ${incomingEmail.subject}`);

    // Act - Step 1: Generate AI response
    console.log('🤖 Step 2: Generating AI response with OpenAI...');
    const startAI = Date.now();
    const llmResponse = await generateResponse(incomingEmail);
    const aiDuration = Date.now() - startAI;

    // Assert - AI response is valid
    assertExists(llmResponse);
    assertExists(llmResponse.content);
    assert(llmResponse.content.length > 10, 'AI response should be substantive');
    assert(llmResponse.tokenCount > 0, 'Token count should be tracked');
    assert(llmResponse.completionTime > 0, 'Completion time should be tracked');

    console.log(`✅ AI response generated (${aiDuration}ms)`);
    console.log(`   Model: ${llmResponse.model}`);
    console.log(`   Tokens: ${llmResponse.tokenCount}`);
    console.log(`   Response preview: ${llmResponse.content.substring(0, 100)}...`);

    // Act - Step 2: Format outgoing email
    console.log('📝 Step 3: Formatting outgoing email...');
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    // Assert - Email is properly formatted
    assertExists(outgoingEmail);
    assertEquals(outgoingEmail.from, incomingEmail.to);
    assertEquals(outgoingEmail.to, incomingEmail.from);
    assert(outgoingEmail.subject.startsWith('Re: '));
    assertEquals(outgoingEmail.body, llmResponse.content);
    assertEquals(outgoingEmail.inReplyTo, incomingEmail.messageId);
    assert(outgoingEmail.references.includes(incomingEmail.messageId));

    console.log('✅ Email formatted correctly');
    console.log(`   To: ${outgoingEmail.to}`);
    console.log(`   Subject: ${outgoingEmail.subject}`);

    // Act - Step 3: Send email via SendGrid
    console.log('📤 Step 4: Sending email via SendGrid...');
    const startSend = Date.now();
    let sendError: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      sendError = err as Error;
    }
    const sendDuration = Date.now() - startSend;

    // Assert - Email sent successfully
    assertEquals(sendError, null, `Email should send successfully: ${sendError?.message}`);

    console.log(`✅ Email sent successfully (${sendDuration}ms)`);
    console.log(`\n🎉 End-to-end test completed successfully!`);
    console.log(`   Total workflow time: ${aiDuration + sendDuration}ms`);
    console.log(`   - AI generation: ${aiDuration}ms`);
    console.log(`   - Email sending: ${sendDuration}ms`);
    console.log(`\n📬 Check ${outgoingEmail.to} inbox to verify delivery`);
  },
});

Deno.test({
  name: 'E2E integration - handles technical support inquiry',
  ignore: !hasAllCredentials(),
  async fn() {
    if (!hasAllCredentials()) {
      console.log('⏭️  Skipping E2E test - credentials not set');
      return;
    }

    // Arrange - Technical support email
    const incomingEmail = createIncomingEmail({
      subject: 'API Integration Help',
      body: 'I\'m trying to integrate your API into my Node.js application. Can you provide documentation and sample code?',
      messageId: `<tech-support-${Date.now()}@example.com>`,
    });

    console.log('📧 Processing technical support inquiry...');

    // Act - Complete workflow
    const llmResponse = await generateResponse(incomingEmail);
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null);
    assert(llmResponse.content.length > 50, 'Technical response should be detailed');

    console.log('✅ Technical support workflow completed');
    console.log(`   Response length: ${llmResponse.content.length} chars`);
  },
});

Deno.test({
  name: 'E2E integration - handles customer complaint',
  ignore: !hasAllCredentials(),
  async fn() {
    if (!hasAllCredentials()) {
      console.log('⏭️  Skipping E2E test - credentials not set');
      return;
    }

    // Arrange - Customer complaint
    const incomingEmail = createIncomingEmail({
      subject: 'Service Issue',
      body: 'I\'m very disappointed with the service. The system has been down for hours and I haven\'t received any updates. This is unacceptable!',
      messageId: `<complaint-${Date.now()}@example.com>`,
    });

    console.log('📧 Processing customer complaint...');

    // Act - Complete workflow
    const llmResponse = await generateResponse(incomingEmail);
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null);

    // Check for empathetic tone
    const lowerContent = llmResponse.content.toLowerCase();
    const hasEmpathy =
      lowerContent.includes('sorry') ||
      lowerContent.includes('apologize') ||
      lowerContent.includes('understand');

    assert(hasEmpathy, 'Response should show empathy');

    console.log('✅ Complaint handling workflow completed');
    console.log('   Response showed appropriate empathy');
  },
});

Deno.test({
  name: 'E2E integration - handles email thread continuation',
  ignore: !hasAllCredentials(),
  async fn() {
    if (!hasAllCredentials()) {
      console.log('⏭️  Skipping E2E test - credentials not set');
      return;
    }

    // Arrange - Email in a thread
    const threadId = `thread-${Date.now()}`;
    const incomingEmail = createIncomingEmail({
      subject: 'Re: Follow-up question',
      body: 'Thanks for your previous response. I have a follow-up question about the implementation details.',
      messageId: `<${threadId}-followup@example.com>`,
      inReplyTo: `<${threadId}-original@example.com>`,
      references: [
        `<${threadId}-root@example.com>`,
        `<${threadId}-original@example.com>`,
      ],
    });

    console.log('📧 Processing threaded email...');

    // Act - Complete workflow
    const llmResponse = await generateResponse(incomingEmail);
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null);
    assert(outgoingEmail.subject.startsWith('Re: '), 'Should maintain Re: prefix');
    assertEquals(
      outgoingEmail.references.length,
      incomingEmail.references.length + 1,
      'Should append to references'
    );

    console.log('✅ Threaded email workflow completed');
    console.log(`   Thread references: ${outgoingEmail.references.length}`);
  },
});

Deno.test({
  name: 'E2E integration - handles email with special characters',
  ignore: !hasAllCredentials(),
  async fn() {
    if (!hasAllCredentials()) {
      console.log('⏭️  Skipping E2E test - credentials not set');
      return;
    }

    // Arrange - Email with special characters
    const incomingEmail = createIncomingEmail({
      subject: 'Question about pricing 💰',
      body: 'Hi! 👋 I\'m interested in your service. What\'s the cost? Is it €100 or $100? Thanks! 😊',
      messageId: `<special-${Date.now()}@example.com>`,
    });

    console.log('📧 Processing email with special characters...');

    // Act - Complete workflow
    const llmResponse = await generateResponse(incomingEmail);
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null);
    assertExists(llmResponse.content);

    console.log('✅ Special characters workflow completed');
    console.log('   Handled emojis and special characters successfully');
  },
});

Deno.test({
  name: 'E2E integration - performance benchmark',
  ignore: !hasAllCredentials(),
  async fn() {
    if (!hasAllCredentials()) {
      console.log('⏭️  Skipping E2E test - credentials not set');
      return;
    }

    // Arrange
    const incomingEmail = createIncomingEmail({
      subject: 'Performance test',
      body: 'This is a quick test to measure the end-to-end performance of the system.',
      messageId: `<perf-${Date.now()}@example.com>`,
    });

    console.log('📊 Running performance benchmark...');

    const overallStart = Date.now();

    // Act - Measure each step
    const aiStart = Date.now();
    const llmResponse = await generateResponse(incomingEmail);
    const aiTime = Date.now() - aiStart;

    const formatStart = Date.now();
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);
    const formatTime = Date.now() - formatStart;

    const sendStart = Date.now();
    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }
    const sendTime = Date.now() - sendStart;

    const totalTime = Date.now() - overallStart;

    // Assert
    assertEquals(error, null);
    assert(aiTime < 30000, 'AI response should complete within 30 seconds');
    assert(sendTime < 10000, 'Email send should complete within 10 seconds');
    assert(totalTime < 40000, 'Total workflow should complete within 40 seconds');

    console.log('✅ Performance benchmark completed');
    console.log('\n📊 Performance Metrics:');
    console.log(`   AI Generation:    ${aiTime}ms (${(aiTime / totalTime * 100).toFixed(1)}%)`);
    console.log(`   Email Formatting: ${formatTime}ms (${(formatTime / totalTime * 100).toFixed(1)}%)`);
    console.log(`   Email Sending:    ${sendTime}ms (${(sendTime / totalTime * 100).toFixed(1)}%)`);
    console.log(`   Total Time:       ${totalTime}ms`);
    console.log(`   Throughput:       ${(1000 / totalTime * 60).toFixed(1)} emails/minute (theoretical)`);
  },
});

Deno.test({
  name: 'E2E integration - handles long detailed email',
  ignore: !hasAllCredentials(),
  async fn() {
    if (!hasAllCredentials()) {
      console.log('⏭️  Skipping E2E test - credentials not set');
      return;
    }

    // Arrange - Long, detailed email
    const longEmail = `Hello,

I'm reaching out because I'm considering implementing your email assistant service for my company. Before we proceed, I need to understand several aspects:

1. Integration Process:
   - How complex is the initial setup?
   - What technical requirements do we need?
   - Do you provide implementation support?

2. Features and Capabilities:
   - Can the AI handle technical inquiries?
   - What's the response accuracy rate?
   - Does it support multiple languages?

3. Pricing and Plans:
   - What are the different pricing tiers?
   - Is there a free trial available?
   - What's included in each plan?

4. Security and Compliance:
   - How is data stored and protected?
   - Are you GDPR compliant?
   - What about data retention policies?

I'd appreciate a comprehensive response addressing these points. We're planning to make a decision within the next two weeks.

Best regards,
John Smith
Technical Director`;

    const incomingEmail = createIncomingEmail({
      subject: 'Detailed inquiry about your service',
      body: longEmail,
      messageId: `<detailed-${Date.now()}@example.com>`,
    });

    console.log('📧 Processing long detailed email...');
    console.log(`   Input length: ${longEmail.length} chars`);

    // Act - Complete workflow
    const llmResponse = await generateResponse(incomingEmail);
    const outgoingEmail = formatOutgoingEmail(incomingEmail, llmResponse);

    let error: Error | null = null;
    try {
      await sendEmail(outgoingEmail);
    } catch (err) {
      error = err as Error;
    }

    // Assert
    assertEquals(error, null);
    assert(
      llmResponse.content.length > 200,
      'Response to detailed email should be comprehensive'
    );
    assert(
      llmResponse.tokenCount > 100,
      'Should use significant tokens for detailed response'
    );

    console.log('✅ Long email workflow completed');
    console.log(`   Response length: ${llmResponse.content.length} chars`);
    console.log(`   Tokens used: ${llmResponse.tokenCount}`);
  },
});

// Test helper output for skipped tests
if (!hasAllCredentials()) {
  console.log('\n⚠️  End-to-End Integration Tests Skipped');
  console.log('   Set required environment variables to run these tests:');
  console.log('   - OPENAI_API_KEY=your_openai_key');
  console.log('   - SENDGRID_API_KEY=your_sendgrid_key');
  console.log('   - SERVICE_EMAIL_ADDRESS=your_service_email@domain.com');
  console.log('   - TEST_RECIPIENT_EMAIL=test_recipient@domain.com (optional)');
  console.log('   Then run: deno test tests/integration/end-to-end.test.ts --allow-all --allow-env\n');
}

