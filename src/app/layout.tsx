import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Momentum Mod Map Roulette',
  description:
    'Pick a random Momentum Mod map instantly with mode filters, difficulty tiers, console command copies, and a full speedrun map archive.',
  keywords: [
    'Momentum Mod',
    'Random Map',
    'Speedrun',
    'Surf',
    'Bhop',
    'KZ',
    'Rocket Jump',
    'Sticky Jump',
    'Ahop',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="antialiased min-h-screen bg-[#0a0a0a] text-neutral-100">
        {children}
      </body>
    </html>
  );
}
