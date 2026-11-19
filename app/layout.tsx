import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KUROGANE III — 3D Martial Arts Fighter',
  description:
    'WebGL 3D karate & martial arts fighting game featuring 3-round arcade combat, local 2P versus, solo tournament progression, online matchmaking, and ranked leaderboards.',
  openGraph: {
    title: 'KUROGANE III — 3D Martial Arts Fighter',
    description:
      'WebGL 3D karate & martial arts fighting game featuring 3-round arcade combat, local 2P versus, solo tournament progression, online matchmaking, and ranked leaderboards.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KUROGANE III — 3D Martial Arts Fighter',
    description:
      'WebGL 3D karate & martial arts fighting game featuring 3-round arcade combat, local 2P versus, solo tournament progression, online matchmaking, and ranked leaderboards.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c0b10',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#0c0b10] text-[#f5efe6] font-sans antialiased overflow-hidden select-none touch-none"
      >
        {children}
      </body>
    </html>
  );
}
