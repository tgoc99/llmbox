'use client';

import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';

const HomePage = (): JSX.Element => {
  return (
    <main className='min-h-screen'>
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />

      {/* Footer */}
      <footer className='bg-gray-900 text-gray-400 py-12'>
        <div className='container-custom'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
            <div className='text-center md:text-left'>
              <div className='text-xl font-bold text-white mb-2'>LLMBox</div>
              <p className='text-sm'>Chat with AI through email</p>
            </div>

            <div className='flex flex-wrap justify-center gap-6 text-sm'>
              <a href='#features' className='hover:text-white transition-colors'>
                Features
              </a>
              <a href='#how-it-works' className='hover:text-white transition-colors'>
                How It Works
              </a>
              <a href='/personifeed' className='hover:text-white transition-colors'>
                personi[feed]
              </a>
            </div>
          </div>

          <div className='mt-8 pt-8 border-t border-gray-800 text-center text-sm'>
            <p>&copy; {new Date().getFullYear()} LLMBox. Powered by OpenAI and Supabase.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
