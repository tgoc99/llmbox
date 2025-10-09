'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface PricingTier {
  name: string;
  price: number;
  tagline: string;
  description: string;
  features: string[];
  priceId: string;
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    tagline: 'Try LLMBox',
    description: 'Free for everyone',
    priceId: 'free',
    features: [
      'Chat via email',
      'GPT-4o-mini access',
      'Email support',
      'Web search capability',
      'Limited usage',
    ],
  },
  {
    name: 'Pro',
    price: 20,
    tagline: 'For everyday productivity',
    description: 'Per month, billed monthly',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
    popular: true,
    features: [
      'Everything in Free, plus:',
      'More usage',
      'GPT-4o & GPT-4o-mini access',
      'Priority support',
      'Web search capability',
    ],
  },
  {
    name: 'Max',
    price: 100,
    tagline: 'Get the most out of LLMBox',
    description: 'Per person billed monthly',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MAX || 'price_max_monthly',
    features: [
      'Everything in Pro, plus:',
      'Much more usage than Pro',
      'All models available',
      'Higher output limits for all tasks',
      'Priority support',
    ],
  },
];

const PricingPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get email from URL params if provided
  if (typeof window !== 'undefined' && !email) {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }

  const handleUpgrade = async (tier: PricingTier) => {
    if (tier.priceId === 'free') {
      return; // Can't upgrade to free
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          priceId: tier.priceId,
          tierName: tier.name.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Simple, transparent pricing. Upgrade or cancel anytime.
          </p>

          {/* Email Input */}
          <div className="max-w-md mx-auto mb-4">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl shadow-lg p-8 flex flex-col ${
                tier.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{tier.tagline}</p>

                <div className="mb-3">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.price === 0 ? '$0' : `$${tier.price}`}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-gray-600 text-base ml-1">
                      /month
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 leading-snug">
                  {tier.description}
                </p>
              </div>

              {/* Button */}
              <button
                onClick={() => handleUpgrade(tier)}
                disabled={tier.priceId === 'free' || loading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-6 ${
                  tier.priceId === 'free'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {tier.priceId === 'free'
                  ? 'Try LLMBox'
                  : loading
                  ? 'Loading...'
                  : 'Try LLMBox'}
              </button>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">How does billing work?</h3>
              <p className="text-gray-600">
                Plans are billed monthly. Your usage allowance resets at the start of each
                billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What does "usage" mean?</h3>
              <p className="text-gray-600">
                Usage is measured based on the AI models you use and how much you interact. Different models
                have different costs. GPT-4o-mini is the most cost-effective, while GPT-4o is more
                powerful but uses more of your allowance per message.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time from your billing dashboard.
                You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What happens if I exceed my usage limit?</h3>
              <p className="text-gray-600">
                You'll receive an email notification. Free tier users will need to upgrade to
                continue. Paid users can upgrade to a higher tier or wait until the next billing
                period when usage resets.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How do I use LLMBox?</h3>
              <p className="text-gray-600">
                Simply send an email to <strong>chat@llmbox.ai</strong> with your question or request.
                You'll receive an AI-generated response directly to your inbox. No app downloads or
                complicated setup required.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Have questions?</p>
          <a
            href="mailto:support@llmbox.ai"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contact Support
          </a>
          <span className="mx-4 text-gray-400">|</span>
          <a href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
            Terms & Privacy
          </a>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
