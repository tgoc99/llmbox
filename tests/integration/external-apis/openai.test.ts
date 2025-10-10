/**
 * Integration test for OpenAI API
 *
 * This test makes real API calls to OpenAI and requires a valid API key.
 * Set OPENAI_API_KEY environment variable to run this test.
 *
 * Run with: deno test tests/integration/ --allow-all --allow-env
 */

import { assert, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  formatEmailInput,
  generateEmailResponse as generateResponse,
} from '../../../supabase/functions/_shared/llmClient.ts';
import type { IncomingEmail } from '../../../supabase/functions/_shared/types.ts';

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
const createTestEmail = (overrides?: Partial<IncomingEmail>): IncomingEmail => {
  return {
    from: 'test@example.com',
    to: 'assistant@mail.llmbox.pro',
    subject: 'Test Email for Integration',
    body: 'Hello! This is a test email. Please respond with a brief greeting.',
    messageId: '<test-integration@llmbox.pro>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
    ...overrides,
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
      to: 'assistant@mail.llmbox.pro',
      subject: 'Re: Previous conversation',
      body: 'Thanks for the previous response. Can you clarify your last point?',
      messageId: '<reply-test@llmbox.pro>',
      inReplyTo: '<original@llmbox.pro>',
      references: ['<original@llmbox.pro>'],
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
      to: 'assistant@mail.llmbox.pro',
      subject: 'Hi',
      body: 'Hello!',
      messageId: '<short-test@llmbox.pro>',
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
      to: 'assistant@mail.llmbox.pro',
      subject: 'Detailed question',
      body: 'I have a detailed question about your service. ' +
        'Specifically, I would like to understand how the system works, ' +
        'what features are available, and what the pricing model looks like. ' +
        'Can you provide comprehensive information about all of these topics?',
      messageId: '<long-test@llmbox.pro>',
      inReplyTo: null,
      references: [],
      timestamp: new Date(),
    };

    // Act
    const longResponse = await generateResponse(longEmail);

    // Assert
    assertExists(longResponse.content);
    assert(
      longResponse.tokenCount > shortResponse.tokenCount,
      'Longer email should use more tokens',
    );

    console.log('✅ OpenAI API email length test passed');
    console.log(`   Short email tokens: ${shortResponse.tokenCount}`);
    console.log(`   Long email tokens: ${longResponse.tokenCount}`);
  },
});

Deno.test({
  name: 'OpenAI integration - handles technical support query',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Technical support email
    const testEmail = createTestEmail({
      subject: 'How to integrate your API?',
      body:
        "Hi, I'm trying to integrate your API into my application. Can you provide me with the basic steps to get started? I'm using Node.js.",
      messageId: '<tech-support@llmbox.pro>',
    });

    // Act
    const response = await generateResponse(testEmail);

    // Assert
    assertExists(response.content);
    assert(response.content.length > 50, 'Technical response should be detailed');
    assert(response.tokenCount > 0);
    assert(
      response.content.toLowerCase().includes('api') ||
        response.content.toLowerCase().includes('integrate') ||
        response.content.toLowerCase().includes('node'),
      'Response should be relevant to the query',
    );

    console.log('✅ OpenAI API technical support test passed');
    console.log(`   Response length: ${response.content.length} chars`);
  },
});

Deno.test({
  name: 'OpenAI integration - handles business inquiry',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Business inquiry
    const testEmail = createTestEmail({
      subject: 'Pricing and plans',
      body:
        "Hello, I'm interested in your service for my company. Can you tell me about your pricing plans and what features are included?",
      messageId: '<business@llmbox.pro>',
    });

    // Act
    const response = await generateResponse(testEmail);

    // Assert
    assertExists(response.content);
    assert(response.content.length > 30, 'Business response should be substantive');
    assert(response.model.includes('gpt'), 'Should use GPT model');

    console.log('✅ OpenAI API business inquiry test passed');
    console.log(`   Model: ${response.model}`);
  },
});

Deno.test({
  name: 'OpenAI integration - handles complaint or issue',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Customer complaint
    const testEmail = createTestEmail({
      subject: 'Issue with recent service',
      body:
        "I've been having problems with your service today. The system keeps timing out and I can't complete my work. This is very frustrating!",
      messageId: '<complaint@llmbox.pro>',
    });

    // Act
    const response = await generateResponse(testEmail);

    // Assert
    assertExists(response.content);
    assert(response.content.length > 40, 'Complaint response should be empathetic and detailed');
    assert(response.tokenCount > 20, 'Response should use reasonable tokens');

    // Check for professional tone markers
    const lowerContent = response.content.toLowerCase();
    const hasProfessionalTone = lowerContent.includes('sorry') ||
      lowerContent.includes('apologize') ||
      lowerContent.includes('understand') ||
      lowerContent.includes('help');

    assert(hasProfessionalTone, 'Response should have empathetic/professional tone');

    console.log('✅ OpenAI API complaint handling test passed');
  },
});

Deno.test({
  name: 'OpenAI integration - handles multi-paragraph email',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Long, detailed email
    const testEmail = createTestEmail({
      subject: 'Multiple questions about your service',
      body: `Hi there,

I have several questions about your email assistant service:

1. How does the AI understand context from previous emails in a thread?
2. What happens if I send an email in a different language?
3. Can I customize the AI's response style?
4. Is there a limit to how many emails I can send per day?

I'm considering using this for my small business and want to make sure it meets our needs.

Thanks in advance for your help!

Best regards,
John`,
      messageId: '<multi-question@llmbox.pro>',
    });

    // Act
    const response = await generateResponse(testEmail);

    // Assert
    assertExists(response.content);
    assert(
      response.content.length > 100,
      'Response to multi-paragraph email should be comprehensive',
    );
    assert(response.tokenCount > 50, 'Should use significant tokens for detailed response');

    console.log('✅ OpenAI API multi-paragraph test passed');
    console.log(`   Input length: ${testEmail.body.length} chars`);
    console.log(`   Response length: ${response.content.length} chars`);
    console.log(`   Token count: ${response.tokenCount}`);
  },
});

Deno.test({
  name: 'OpenAI integration - validates input formatting',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange
    const testEmail = createTestEmail({
      from: 'user@company.com',
      subject: 'Quick question',
      body: 'What is your business hours?',
    });

    // Act - Test input formatting
    const input = formatEmailInput(testEmail);

    // Assert - Input structure
    assertExists(input);
    assert(input.includes('Respond to this email:'), 'Input should have instruction');
    assert(input.includes(testEmail.from), 'Input should include sender');
    assert(input.includes(testEmail.subject), 'Input should include subject');
    assert(input.includes(testEmail.body), 'Input should include body');

    // Act - Generate actual response
    const response = await generateResponse(testEmail);

    // Assert - Response is generated
    assertExists(response.content);
    assert(response.content.length > 10);

    console.log('✅ OpenAI API input formatting test passed');
    console.log(`   Input length: ${input.length} chars`);
  },
});

Deno.test({
  name: 'OpenAI integration - handles special characters in email',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Email with special characters
    const testEmail = createTestEmail({
      subject: 'Test with émojis & spëcial çhars',
      body:
        'Hello! 🎉 I have a question about pricing: $100-$200/month? Also, what about 50% discounts & other deals? Let me know! 😊',
      messageId: '<special-chars@llmbox.pro>',
    });

    // Act
    const response = await generateResponse(testEmail);

    // Assert
    assertExists(response.content);
    assert(response.content.length > 20, 'Should generate meaningful response');
    assert(response.tokenCount > 0);

    console.log('✅ OpenAI API special characters test passed');
    console.log(`   Input had emojis and special chars, response generated successfully`);
  },
});

Deno.test({
  name: 'OpenAI integration - consistency check with multiple calls',
  ignore: !hasApiKey(),
  async fn() {
    if (!hasApiKey()) {
      console.log('⏭️  Skipping OpenAI integration test - OPENAI_API_KEY not set');
      return;
    }

    // Arrange - Same email for multiple calls
    const testEmail = createTestEmail({
      subject: 'Simple question',
      body: 'What are your service hours?',
      messageId: '<consistency-test@llmbox.pro>',
    });

    // Act - Call API twice
    const response1 = await generateResponse(testEmail);
    const response2 = await generateResponse(testEmail);

    // Assert - Both responses are valid
    assertExists(response1.content);
    assertExists(response2.content);
    assert(response1.content.length > 10);
    assert(response2.content.length > 10);
    assert(response1.model === response2.model, 'Should use same model');

    // Responses should be similar in length (within 3x factor)
    const lengthRatio = Math.max(response1.content.length, response2.content.length) /
      Math.min(response1.content.length, response2.content.length);
    assert(lengthRatio < 3, 'Response lengths should be relatively consistent');

    console.log('✅ OpenAI API consistency test passed');
    console.log(`   Response 1 length: ${response1.content.length} chars`);
    console.log(`   Response 2 length: ${response2.content.length} chars`);
    console.log(`   Length ratio: ${lengthRatio.toFixed(2)}`);
  },
});

// Test helper output for skipped tests
if (!hasApiKey()) {
  console.log('\n⚠️  OpenAI Integration Tests Skipped');
  console.log('   Set OPENAI_API_KEY environment variable to run these tests');
  console.log('   Example: export OPENAI_API_KEY=sk-...');
  console.log('   Then run: deno test tests/integration/ --allow-all --allow-env\n');
}
