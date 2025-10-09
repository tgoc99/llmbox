/**
 * User API Route
 * Get user data by email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data (sanitized for client)
    return NextResponse.json({
      email: user.email,
      tier: user.tier,
      cost_used_usd: user.cost_used_usd,
      cost_limit_usd: user.cost_limit_usd,
      subscription_status: user.subscription_status,
      billing_period_start: user.billing_period_start,
      billing_period_end: user.billing_period_end,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

