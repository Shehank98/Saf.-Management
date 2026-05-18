import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Safari Adventures',
  description: 'Book thrilling safari adventures in Sri Lanka',
  manifest: '/pwa/manifest.json',
  icons: {
    icon: '/pwa/icons/icon-192.png',
    apple: '/pwa/icons/icon-192.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/pwa/manifest.json" />
        <meta name="theme-color" content="#2D6A4F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Safari Adventures" />
        <link rel="apple-touch-icon" href="/pwa/icons/icon-192.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
      </body>
    </html>
  );
}
