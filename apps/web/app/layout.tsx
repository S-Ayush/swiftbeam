import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://swiftbeam-web.vercel.app'),
  title: {
    default: 'SwiftBeam - Instant P2P File Sharing | No Signup Required',
    template: '%s | SwiftBeam',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SwiftBeam',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  description:
    'Share files instantly with peer-to-peer technology. No signup required, no server storage, no file size tracking. Fast, secure, and private direct transfers up to 15GB.',
  keywords: [
    'file sharing',
    'p2p file transfer',
    'peer to peer',
    'secure file sharing',
    'private file transfer',
    'no signup file sharing',
    'large file transfer',
    'WebRTC file sharing',
    'instant file sharing',
    'encrypted file transfer',
  ],
  authors: [{ name: 'SwiftBeam', url: 'https://swiftbeam-web.vercel.app' }],
  creator: 'SwiftBeam',
  publisher: 'SwiftBeam',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'SwiftBeam - Instant P2P File Sharing',
    description:
      'Share files up to 15GB instantly. No signup, no server storage. Your files go directly from you to your recipient.',
    url: 'https://swiftbeam-web.vercel.app',
    siteName: 'SwiftBeam',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SwiftBeam - Instant P2P File Sharing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwiftBeam - Instant P2P File Sharing',
    description:
      'Share files instantly with P2P technology. No signup required.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://swiftbeam-web.vercel.app',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <OfflineBanner />
            <AuthProvider>
              {children}
            </AuthProvider>
            <PWAInstallPrompt />
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
