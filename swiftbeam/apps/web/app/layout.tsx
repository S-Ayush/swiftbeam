import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'SwiftBeam - Instant P2P File Sharing',
  description:
    'Share files instantly with peer-to-peer technology. No signup required. No server storage. Just fast, secure, direct transfers.',
  keywords: ['file sharing', 'p2p', 'peer to peer', 'secure', 'private'],
  authors: [{ name: 'SwiftBeam' }],
  openGraph: {
    title: 'SwiftBeam - Instant P2P File Sharing',
    description: 'Share files instantly. No signup. No storage. Just P2P.',
    type: 'website',
  },
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
