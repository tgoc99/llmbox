'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Mail, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface UserData {
  email: string;
  tier: string;
  cost_used_usd: number;
  cost_limit_usd: number;
  subscription_status: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
}

const BillingPage = () => {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUserData = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/user?email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        throw new Error('User not found');
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!userData) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailParam) {
      loadUserData();
    }
  }, []);

  const usagePercentage = userData
    ? (userData.cost_used_usd / userData.cost_limit_usd) * 100
    : 0;

  const remainingBudget = userData
    ? userData.cost_limit_usd - userData.cost_used_usd
    : 0;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTierDisplayName = (tier: string): string => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getStatusColor = (status: string | null): string => {
    if (!status) return 'text-gray-600';
    switch (status) {
      case 'active':
      case 'trialing':
        return 'text-green-600';
      case 'past_due':
        return 'text-yellow-600';
      case 'canceled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing & Usage</h1>
          <p className="text-gray-600">Manage your subscription and view usage statistics</p>
        </div>

        {/* Email Input */}
        {!userData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your email to view billing information
            </label>
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUserData()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={loadUserData}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'View Billing'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* User Data Display */}
        {userData && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Account Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Current Plan</p>
                    <p className="font-semibold">{getTierDisplayName(userData.tier)}</p>
                  </div>
                </div>
                {userData.subscription_status && (
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`font-semibold ${getStatusColor(userData.subscription_status)}`}>
                        {userData.subscription_status.charAt(0).toUpperCase() +
                          userData.subscription_status.slice(1)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-semibold">{formatDate(userData.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Usage Statistics</h2>

              {/* Usage Bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Budget Usage</span>
                  <span className="text-sm font-medium text-gray-700">
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      usagePercentage >= 90
                        ? 'bg-red-600'
                        : usagePercentage >= 75
                        ? 'bg-yellow-500'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Used</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(userData.cost_used_usd)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Limit</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(userData.cost_limit_usd)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="font-semibold text-lg">{formatCurrency(remainingBudget)}</p>
                  </div>
                </div>
              </div>

              {/* Billing Period */}
              {userData.billing_period_start && userData.billing_period_end && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Current Billing Period:</strong>{' '}
                    {formatDate(userData.billing_period_start)} -{' '}
                    {formatDate(userData.billing_period_end)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Usage resets at the start of each billing period
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Manage Subscription</h2>
              <div className="space-y-4">
                {userData.tier !== 'free' ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Manage Subscription in Stripe'}
                  </button>
                ) : (
                  <a
                    href={`/pricing?email=${encodeURIComponent(userData.email)}`}
                    className="block w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Upgrade to Paid Plan
                  </a>
                )}

                <p className="text-sm text-gray-600 text-center">
                  You can upgrade, downgrade, update payment methods, or cancel anytime through the
                  Stripe portal.
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                ← Back to Home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;

