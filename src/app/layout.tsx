import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Montserrat } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import './globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Conductor — Command your AI agents',
  description:
    'The command tower for directing multiple AI agents with clear roles, realtime visibility, and low-stress escalation.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Conductor — Command your AI agents',
    description: 'Try the live demo — feel the Needs You moment in under a minute.',
    url: appUrl,
    siteName: 'Conductor',
    images: [{ url: '/og-needs-you.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conductor — Command your AI agents',
    description: 'Try the live demo — feel the Needs You moment in under a minute.',
    images: ['/og-needs-you.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
