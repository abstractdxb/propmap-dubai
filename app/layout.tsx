import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PropMap Dubai — Real Estate Intelligence',
  description: 'Transaction history, rental indexes, and price trends for every building in Dubai.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
