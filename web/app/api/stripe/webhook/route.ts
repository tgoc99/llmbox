/**
 * Stripe Webhook API Route
 * Handles Stripe webhook events for subscription lifecycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import {
  getUserByStripeCustomerId,
  updateSubscriptionStatus,
  resetUserCostUsage,
  supabase,
} from '@/lib/supabase';
import Stripe from 'stripe';

// Disable body parsing, need raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 },
    );
  }

  console.log('Received webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}

/**
 * Handle successful checkout
 */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session): Promise<void> => {
  console.log('Processing checkout.session.completed:', session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error('Missing customer or subscription ID');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Get user from database
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Get tier name from metadata
  const tierName = session.metadata?.tier_name || 'basic';

  // Get tier limits from pricing_tiers table
  const { data: tierData } = await supabase
    .from('pricing_tiers')
    .select('cost_limit_usd')
    .eq('tier_name', tierName)
    .single();

  const costLimit = tierData?.cost_limit_usd || 10.0;

  // Update user with subscription info
  await supabase
    .from('users')
    .update({
      tier: tierName,
      cost_limit_usd: costLimit,
      cost_used_usd: 0, // Reset usage for new subscription
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status,
      billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      billing_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', user.id);

  console.log('User upgraded:', {
    userId: user.id,
    email: user.email,
    tier: tierName,
    subscriptionId,
  });
};

/**
 * Handle subscription updated
 */
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log('Processing customer.subscription.updated:', subscription.id);

  const customerId = subscription.customer as string;

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status and billing period
  await supabase
    .from('users')
    .update({
      subscription_status: subscription.status,
      billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      billing_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', user.id);

  console.log('Subscription updated:', {
    userId: user.id,
    status: subscription.status,
  });
};

/**
 * Handle subscription deleted
 */
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  const customerId = subscription.customer as string;

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Downgrade user to free tier
  await supabase
    .from('users')
    .update({
      tier: 'free',
      cost_limit_usd: 1.0,
      cost_used_usd: 0,
      subscription_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('id', user.id);

  console.log('User downgraded to free:', {
    userId: user.id,
    email: user.email,
  });
};

/**
 * Handle successful invoice payment (renewal)
 */
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Reset usage for new billing period
  await resetUserCostUsage(customerId);

  console.log('Usage reset for new billing period:', {
    userId: user.id,
    email: user.email,
  });
};

/**
 * Handle failed invoice payment
 */
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log('Processing invoice.payment_failed:', invoice.id);

  const customerId = invoice.customer as string;

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status
  await updateSubscriptionStatus(customerId, 'past_due');

  console.log('Subscription marked as past_due:', {
    userId: user.id,
    email: user.email,
  });
};

