/**
 * Integration test for OpenAI API
 *
 * This test makes real API calls to OpenAI and requires a valid API key.
 * Set OPENAI_API_KEY environment variable to run this test.
 *
 * Run with: deno test tests/integration/ --allow-all --allow-env
 */

import { assert, assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { generateResponse } from '../../supabase/functions/email-webhook/llmClient.ts';
import type { IncomingEmail } from '../../supabase/functions/email-webhook/types.ts';

/**
 * Check if OpenAI API key is available
 */
const hasApiKey = (): boolean => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  return apiKey !== undefined && apiKey.length > 0;
};

/**
 * Create a test email for integration testing
 */
const createTestEmail = (): IncomingEmail => {
  return {
    from: 'test@example.com',
    to: 'assistant@yourdomain.com',
    subject: 'Test Email for Integration',
    body: 'Hello! This is a test email. Please respond with a brief greeting.',
    messageId: '<test-integration@llmbox.local>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };
};

Deno.test({
  name: 'OpenAI integration - generates response with real API',
  ignore: !hasApiKey(),
  async fn() {
    // Skip test with helpful message if API key not available
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange
    const testEmail = createTestEmail();

    // Act
    const response = await generateResponse(testEmail);

    // Assert - Response structure
    assertExists(response, 'Response should exist');
    assertExists(response.content, 'Response should have content');
    assertExists(response.model, 'Response should have model');
    assertExists(response.tokenCount, 'Response should have token count');
    assertExists(response.completionTime, 'Response should have completion time');

    // Assert - Response content quality
    assert(
      response.content.length > 0,
      'Response content should not be empty',
    );

    assert(
      response.model.includes('gpt'),
      `Model should be a GPT model, got: ${response.model}`,
    );

    assert(
      response.tokenCount > 0,
      `Token count should be positive, got: ${response.tokenCount}`,
    );

    assert(
      response.completionTime > 0,
      `Completion time should be positive, got: ${response.completionTime}`,
    );

    // Log response for manual verification
    console.log('✅ OpenAI API integration test passed');
    console.log(`   Model: ${response.model}`);
    console.log(`   Tokens: ${response.tokenCount}`);
    console.log(`   Time: ${response.completionTime}ms`);
    console.log(`   Response preview: ${response.content.substring(0, 50)}...`);
  },
});

Deno.test({
  name: 'OpenAI integration - handles email with reply context',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Email that's a reply in a thread
    const testEmail: IncomingEmail = {
      from: 'user@example.com',
      to: 'assistant@yourdomain.com',
      subject: 'Re: Previous conversation',
      body: 'Thanks for the previous response. Can you clarify your last point?',
      messageId: '<reply-test@llmbox.local>',
      inReplyTo: '<original@llmbox.local>',
      references: ['<original@llmbox.local>'],
      timestamp: new Date(),
    };

    // Act
    const response = await generateResponse(testEmail);

    // Assert
    assertExists(response.content);
    assert(response.content.length > 10, 'Response should be substantive');
    assert(response.tokenCount > 0);

    console.log('✅ OpenAI API reply context test passed');
  },
});

Deno.test({
  name: 'OpenAI integration - respects timeout configuration',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange
    const testEmail = createTestEmail();
    const startTime = Date.now();

    // Act
    const response = await generateResponse(testEmail);
    const totalTime = Date.now() - startTime;

    // Assert - Should complete within reasonable timeout (30s + some buffer)
    assert(
      totalTime < 35000,
      `Total time ${totalTime}ms should be less than 35 seconds`,
    );

    // Assert - Completion time should be tracked accurately
    assert(
      Math.abs(response.completionTime - totalTime) < 1000,
      'Completion time should be close to actual time',
    );

    console.log('✅ OpenAI API timeout test passed');
    console.log(`   Total time: ${totalTime}ms`);
  },
});

Deno.test({
  name: 'OpenAI integration - handles different email lengths',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Short email
    const shortEmail: IncomingEmail = {
      from: 'test@example.com',
      to: 'assistant@yourdomain.com',
      subject: 'Hi',
      body: 'Hello!',
      messageId: '<short-test@llmbox.local>',
      inReplyTo: null,
      references: [],
      timestamp: new Date(),
    };

    // Act
    const shortResponse = await generateResponse(shortEmail);

    // Assert
    assertExists(shortResponse.content);
    assert(shortResponse.tokenCount > 0);

    // Arrange - Longer email
    const longEmail: IncomingEmail = {
      from: 'test@example.com',
      to: 'assistant@yourdomain.com',
      subject: 'Detailed question',
      body:
        'I have a detailed question about your service. ' +
        'Specifically, I would like to understand how the system works, ' +
        'what features are available, and what the pricing model looks like. ' +
        'Can you provide comprehensive information about all of these topics?',
      messageId: '<long-test@llmbox.local>',
      inReplyTo: null,
      references: [],
      timestamp: new Date(),
    };

    // Act
    const longResponse = await generateResponse(longEmail);

    // Assert
    assertExists(longResponse.content);
    assert(longResponse.tokenCount > shortResponse.tokenCount, 'Longer email should use more tokens');

    console.log('✅ OpenAI API email length test passed');
    console.log(`   Short email tokens: ${shortResponse.tokenCount}`);
    console.log(`   Long email tokens: ${longResponse.tokenCount}`);
  },
});

// Test helper output for skipped tests
if (!hasApiKey()) {
  console.log('\n⚠️  OpenAI Integration Tests Skipped');
  console.log('   Set OPENAI_API_KEY environment variable to run these tests');
  console.log('   Example: export OPENAI_API_KEY=sk-...');
  console.log('   Then run: deno test tests/integration/ --allow-all --allow-env\n');
}

