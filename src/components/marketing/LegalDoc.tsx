import Link from 'next/link';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/site';
import { getMessages, translate } from '@/i18n/get-messages';
import type { Locale } from '@/i18n/types';

export function LegalDoc({
  title,
  updated,
  locale = 'en',
  children,
}: {
  title: string;
  updated: string;
  locale?: Locale;
  children: React.ReactNode;
}) {
  const t = (path: string, vars?: Record<string, string | number>) =>
    translate(getMessages(locale), path, vars);

  return (
    <article className="mx-auto max-w-3xl px-5 sm:px-6 py-12 md:py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-[#6b6b66]">{t('legal.eyebrow')}</p>
      <h1 className="font-display text-4xl tracking-tight mt-2">{title}</h1>
      <p className="mt-3 text-sm text-[#6b6b66]">
        {t('legal.lastUpdated', { date: updated })}
      </p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[#3a3a36] [&_h2]:font-medium [&_h2]:text-[#141414] [&_h2]:text-lg [&_h2]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
      <p className="mt-12 text-sm text-[#6b6b66]">
        {t('legal.questions')}{' '}
        <a href={SUPPORT_MAILTO} className="underline underline-offset-2 text-[#141414]">
          {SUPPORT_EMAIL}
        </a>
        {' · '}
        <Link href="/" className="underline underline-offset-2 text-[#141414]">
          {t('legal.backHome')}
        </Link>
      </p>
    </article>
  );
}
