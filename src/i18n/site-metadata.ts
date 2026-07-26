import type { Metadata } from 'next';
import { getMessages, translate } from '@/i18n/get-messages';
import { getServerLocale } from '@/i18n/locale-server';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function buildRootMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getMessages(locale);
  const title = translate(m, 'meta.title');
  const description = translate(m, 'meta.description');
  const ogDescription = translate(m, 'meta.ogDescription');
  return {
    metadataBase: new URL(appUrl),
    title,
    description,
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title,
      description: ogDescription,
      url: appUrl,
      siteName: 'Conductor',
      images: [{ url: '/og-needs-you.png', width: 1200, height: 630 }],
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: ['/og-needs-you.png'],
    },
  };
}

export async function buildHomeMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getMessages(locale);
  const title = translate(m, 'meta.title');
  const description = translate(m, 'meta.homeDescription');
  const ogDescription = translate(m, 'meta.ogDescription');
  return {
    title,
    description,
    openGraph: {
      title,
      description: ogDescription,
      images: [{ url: '/og-needs-you.png', width: 1200, height: 630 }],
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: ['/og-needs-you.png'],
    },
  };
}

export async function buildMomentMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getMessages(locale);
  const title = translate(m, 'meta.momentTitle');
  const description = translate(m, 'meta.momentDescription');
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: '/og-needs-you.png', width: 1200, height: 630 }],
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-needs-you.png'],
    },
  };
}
