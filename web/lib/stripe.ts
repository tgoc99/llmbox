/**
 * Stripe client for web app
 * Server-side only - DO NOT use in client components
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
  typescript: true,
});

/**
 * Stripe pricing configuration
 */
export const PRICING_CONFIG = {
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
    name: 'Pro',
    amount: 2000, // $20 in cents
  },
  max: {
    priceId: process.env.STRIPE_PRICE_ID_MAX || 'price_max_monthly',
    name: 'Max',
    amount: 10000, // $100 in cents
  },
} as const;

export type PricingTier = keyof typeof PRICING_CONFIG;

/**
 * Get Stripe publishable key (safe for client-side)
 */
export const getStripePublishableKey = (): string => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
};

/**
 * Format amount in cents to currency string
 */
export const formatAmount = (amountInCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};

