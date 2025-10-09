import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LLMBox - Chat with AI Through Email',
  description: 'No app downloads. No sign-ups. Just send an email and get intelligent responses powered by OpenAI.',
  keywords: ['AI', 'email', 'chatbot', 'OpenAI', 'GPT', 'assistant'],
  authors: [{ name: 'LLMBox' }],
  icons: 'https://www.emoji.family/api/emojis/1f4e7/noto/svg',
  openGraph: {
    title: 'LLMBox - Chat with AI Through Email',
    description: 'No app downloads. No sign-ups. Just send an email and get intelligent responses powered by OpenAI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLMBox - Chat with AI Through Email',
    description: 'No app downloads. No sign-ups. Just send an email and get intelligent responses powered by OpenAI.',
  },
};

const Layout = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
};

export default Layout;

