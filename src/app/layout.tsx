import type { Metadata } from 'next';
// Removed Geist and Geist_Mono imports
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers';

// Removed geistSans and geistMono constant declarations

export const metadata: Metadata = {
  title: 'AAWSA Billing Portal',
  description: 'Bulk meter bill calculation and water usage management for AAWSA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"> {/* Removed font variables */}
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
