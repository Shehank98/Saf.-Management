import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SkipToContent } from '@/components/skip-to-content';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Safari Adventures',
  description: 'Book thrilling safari adventures in Sri Lanka',
  manifest: '/pwa/manifest.json',
  icons: {
    icon: '/pwa/icons/icon-192.png',
    apple: '/pwa/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Safari Adventures',
  },
};

export const viewport: Viewport = {
  themeColor: '#2D6A4F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/pwa/manifest.json" />
        <link rel="apple-touch-icon" href="/pwa/icons/icon-192.png" />
      </head>
      <body className={inter.className}>
        <SkipToContent />
        <Providers>
          <div id="main-content">{children}</div>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
      </body>
    </html>
  );
}
