'use client';

import { Chakra_Petch } from 'next/font/google';

const chakraPetch = Chakra_Petch({
  weight: ['600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

interface PersonifeedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}

const sizeMap = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-5xl md:text-6xl',
};

export const PersonifeedLogo = ({
  size = 'lg',
  className = '',
  primaryColor = 'text-purple-400',
  accentColor = 'text-purple-600',
}: PersonifeedLogoProps): JSX.Element => {
  return (
    <h1
      className={`${chakraPetch.className} ${sizeMap[size]} font-bold ${className}`}
    >
      <span className={primaryColor}>personi</span>
      <span className={accentColor}>[feed]</span>
    </h1>
  );
};
