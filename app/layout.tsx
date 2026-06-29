import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'BugRace — QA Training Platform',
  description: 'Find the bug. Win the race. Daily challenges for QA Engineers and SDETs.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
