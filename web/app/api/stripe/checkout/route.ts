/**
 * Stripe Checkout Session API Route
 * Creates a Stripe Checkout session for upgrading to a paid plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserByEmail, supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, priceId, tierName } = body;

    // Validate inputs
    if (!email || !priceId || !tierName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, priceId, tierName' },
        { status: 400 },
      );
    }

    // Get or create user in database
    let user = await getUserByEmail(email);

    if (!user) {
      // Create new user if doesn't exist
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          tier: 'free',
          cost_used_usd: 0,
          cost_limit_usd: 1.0,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      user = newUser;
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Get web app URL
    const baseUrl =
      process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?email=${encodeURIComponent(email)}`,
      metadata: {
        user_id: user.id,
        email,
        tier_name: tierName,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

