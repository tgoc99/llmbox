'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import process from 'node:process';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://nopocimtfthppwssohty.supabase.co';

const PersonifeedPage = (): JSX.Element => {
  const [email, setEmail] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    setError('');
  };

  const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setPrompt(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/personifeed-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          initialPrompt: prompt,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail('');
        setPrompt('');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (_err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const characterCount = prompt.length;
  const maxCharacters = 2000;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <main className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50'>
      {/* Hero Section with Form */}
      <section className='container-custom py-20 md:py-32'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'>
              personi[feed]
            </h1>
            <p className='text-xl md:text-2xl text-gray-700 mb-4'>
              Your AI-powered daily digest, tailored to you
            </p>
            <p className='text-lg text-gray-600'>
              Get a personalized newsletter every day at 11am ET. No password, no login—just email.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className='bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-8 text-center'>
              <div className='text-green-600 text-xl font-semibold mb-2'>
                🎉 Success!
              </div>
              <p className='text-green-700'>
                Your first newsletter arrives tomorrow at 11am ET. Check your inbox!
              </p>
            </div>
          )}

          {/* Signup Form */}
          {!success && (
            <div className='bg-white rounded-2xl shadow-xl p-8 md:p-12'>
              <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className='mb-6'>
                  <label htmlFor='email' className='block text-sm font-semibold text-gray-700 mb-2'>
                    Your Email Address
                  </label>
                  <input
                    type='email'
                    id='email'
                    value={email}
                    onChange={handleEmailChange}
                    placeholder='you@example.com'
                    required
                    disabled={loading}
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed'
                  />
                </div>

                {/* Prompt Textarea */}
                <div className='mb-6'>
                  <label
                    htmlFor='prompt'
                    className='block text-sm font-semibold text-gray-700 mb-2'
                  >
                    What would you like in your daily newsletter?
                  </label>
                  <textarea
                    id='prompt'
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder='Example: Send me the top 3 AI news stories, a motivational quote, and the weather in NYC'
                    required
                    rows={6}
                    disabled={loading}
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed'
                  />
                  <div className='flex justify-between items-center mt-2'>
                    <p className='text-sm text-gray-500'>
                      Be as specific or creative as you like!
                    </p>
                    <p
                      className={`text-sm ${
                        isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500'
                      }`}
                    >
                      {characterCount} / {maxCharacters}
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className='bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6'>
                    <p className='text-red-700 text-sm'>{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type='submit'
                  disabled={loading || isOverLimit || !email || !prompt}
                  className='w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                >
                  {loading ? 'Starting Your Newsletter...' : 'Start My Daily Newsletter'}
                </button>
              </form>
            </div>
          )}

          {/* How It Works */}
          <div className='mt-16 grid md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>📧</span>
              </div>
              <h3 className='font-bold text-lg mb-2'>1. Sign Up</h3>
              <p className='text-gray-600 text-sm'>
                Enter your email and describe what you want in your daily digest
              </p>
            </div>

            <div className='text-center'>
              <div className='bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🤖</span>
              </div>
              <h3 className='font-bold text-lg mb-2'>2. AI Generates</h3>
              <p className='text-gray-600 text-sm'>
                Every day at 11am ET, AI creates your personalized newsletter
              </p>
            </div>

            <div className='text-center'>
              <div className='bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>✉️</span>
              </div>
              <h3 className='font-bold text-lg mb-2'>3. Refine & Enjoy</h3>
              <p className='text-gray-600 text-sm'>
                Reply to any newsletter to customize future content
              </p>
            </div>
          </div>

          {/* Features */}
          <div className='mt-16 bg-white rounded-2xl shadow-xl p-8'>
            <h2 className='text-2xl font-bold text-center mb-8'>Why personi[feed]?</h2>
            <div className='grid md:grid-cols-2 gap-6'>
              <div className='flex items-start gap-4'>
                <span className='text-2xl'>🎯</span>
                <div>
                  <h4 className='font-semibold mb-1'>100% Personalized</h4>
                  <p className='text-sm text-gray-600'>
                    Every newsletter is tailored to your specific interests and preferences
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4'>
                <span className='text-2xl'>🚀</span>
                <div>
                  <h4 className='font-semibold mb-1'>Zero Friction</h4>
                  <p className='text-sm text-gray-600'>
                    No password, no login, no app. Just email—simple and secure
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4'>
                <span className='text-2xl'>💬</span>
                <div>
                  <h4 className='font-semibold mb-1'>Conversational</h4>
                  <p className='text-sm text-gray-600'>
                    Reply to any newsletter to refine and customize future content
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4'>
                <span className='text-2xl'>⏰</span>
                <div>
                  <h4 className='font-semibold mb-1'>Daily Consistency</h4>
                  <p className='text-sm text-gray-600'>
                    Arrives every day at 11am ET—reliable and predictable
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-gray-400 py-12'>
        <div className='container-custom'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
            <div className='text-center md:text-left'>
              <div className='text-xl font-bold text-white mb-2'>personi[feed]</div>
              <p className='text-sm'>Your AI-powered daily digest</p>
            </div>

            <div className='flex flex-wrap justify-center gap-6 text-sm'>
              <a href='/' className='hover:text-white transition-colors'>
                LLMBox Home
              </a>
              <a href='/personifeed' className='hover:text-white transition-colors'>
                personi[feed]
              </a>
            </div>
          </div>

          <div className='mt-8 pt-8 border-t border-gray-800 text-center text-sm'>
            <p>&copy; {new Date().getFullYear()} personi[feed]. Powered by OpenAI and Supabase.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default PersonifeedPage;
