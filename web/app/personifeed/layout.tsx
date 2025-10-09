import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'personi[feed] - Your AI-Powered Daily Digest',
  description:
    'Get a personalized newsletter every day at 11am ET. No password, no login—just email. Powered by OpenAI.',
  keywords: [
    'newsletter',
    'personalized',
    'AI',
    'email',
    'daily digest',
    'OpenAI',
    'GPT',
  ],
  authors: [{ name: 'personi[feed]' }],
  openGraph: {
    title: 'personi[feed] - Your AI-Powered Daily Digest',
    description:
      'Get a personalized newsletter every day at 11am ET. No password, no login—just email.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'personi[feed] - Your AI-Powered Daily Digest',
    description:
      'Get a personalized newsletter every day at 11am ET. No password, no login—just email.',
  },
};

const PersonifeedLayout = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return <>{children}</>;
};

export default PersonifeedLayout;
