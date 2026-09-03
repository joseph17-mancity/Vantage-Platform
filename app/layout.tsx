import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vantage — Honest admissions context',
  description: 'A grounded view of your fit for graduate programs.',
  icons: {
    icon: '/vantage-mark.svg',
    shortcut: '/vantage-mark.svg',
    apple: '/vantage-mark-512.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
