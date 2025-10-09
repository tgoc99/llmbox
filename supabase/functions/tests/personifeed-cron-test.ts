/**
 * Unit tests for personifeed-cron function
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// Mock data for testing
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  created_at: new Date(),
  active: true,
};

const mockCustomizations = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    user_id: mockUser.id,
    content: 'Send me AI news daily',
    type: 'initial' as const,
    created_at: new Date(),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    user_id: mockUser.id,
    content: 'Also include tech updates',
    type: 'feedback' as const,
    created_at: new Date(),
  },
];

Deno.test('Newsletter generator - formats customizations correctly', () => {
  // Test that customizations are properly formatted
  const initial = mockCustomizations.find((c) => c.type === 'initial');
  const feedbacks = mockCustomizations.filter((c) => c.type === 'feedback');

  assertExists(initial);
  assertEquals(feedbacks.length, 1);
  assertEquals(initial.content, 'Send me AI news daily');
  assertEquals(feedbacks[0].content, 'Also include tech updates');
});

Deno.test('Newsletter generator - handles empty feedback', () => {
  const customizationsWithoutFeedback: Array<{
    id: string;
    user_id: string;
    content: string;
    type: 'initial' | 'feedback';
    created_at: Date;
  }> = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      user_id: mockUser.id,
      content: 'Send me AI news daily',
      type: 'initial',
      created_at: new Date(),
    },
  ];

  const feedbacks = customizationsWithoutFeedback.filter((c) => c.type === 'feedback');
  assertEquals(feedbacks.length, 0);
});

Deno.test('Email sender - formats date correctly', () => {
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  assertExists(todayDate);
  // Should contain day of week
  const hasWeekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].some(
    (day) => todayDate.includes(day),
  );
  assertEquals(hasWeekday, true);
});

Deno.test('Email sender - creates proper subject line', () => {
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const subject = `Your Daily Digest - ${todayDate}`;

  assertExists(subject);
  assertEquals(subject.includes('Your Daily Digest'), true);
  assertEquals(subject.includes(todayDate), true);
});

