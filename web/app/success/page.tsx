'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';

const SuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    customerEmail: string;
    amountTotal: number;
  } | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // In a production app, you'd verify the session server-side
        // For now, we'll just mark as successful
        setLoading(false);
      } catch (error) {
        console.error('Error verifying session:', error);
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Welcome to your new LLMBox plan!
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">What happens next?</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Your account has been upgraded</h3>
                <p className="text-gray-600">
                  Your new credit limit is now active. Start using LLMBox immediately!
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Send an email to get started</h3>
                <p className="text-gray-600 mb-2">
                  Simply email your questions to:
                </p>
                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <Mail className="w-5 h-5 text-gray-400 mr-2" />
                  <code className="text-blue-600 font-mono">chat@llmbox.ai</code>
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get AI-powered responses</h3>
                <p className="text-gray-600">
                  Receive intelligent responses from GPT-4o directly to your inbox. Have a conversation by replying to previous emails.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Quick Tips</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• You can ask anything - from coding help to creative writing</li>
            <li>• Reply to previous emails to continue conversations with context</li>
            <li>• Check your usage anytime on your billing dashboard</li>
            <li>• Manage or cancel your subscription anytime through Stripe</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/billing"
            className="flex-1 px-6 py-3 bg-gray-800 text-white text-center rounded-lg font-semibold hover:bg-gray-900 flex items-center justify-center"
          >
            View Billing Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
          <a
            href="/"
            className="flex-1 px-6 py-3 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
          >
            Back to Home
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-2">Need help getting started?</p>
          <a
            href="mailto:support@llmbox.ai"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;

