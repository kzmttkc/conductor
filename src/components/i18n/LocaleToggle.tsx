'use client';

import { useLocale } from '@/i18n/locale-context';
import type { Locale } from '@/i18n/types';
import { cn } from '@/lib/utils';

export function LocaleToggle({
  className,
  tone = 'light',
}: {
  className?: string;
  tone?: 'light' | 'dark' | 'app';
}) {
  const { locale, setLocale, t } = useLocale();

  const btn = (code: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(code)}
      className={cn(
        'rounded-md px-2 py-1 text-xs font-medium transition-colors',
        locale === code
          ? tone === 'dark'
            ? 'bg-white text-black'
            : tone === 'app'
              ? 'bg-foreground text-background'
              : 'bg-[#141414] text-white'
          : tone === 'dark'
            ? 'text-white/70 hover:text-white'
            : 'text-muted-foreground hover:text-foreground'
      )}
      aria-pressed={locale === code}
      aria-label={`${t('nav.language')}: ${label}`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border p-0.5',
        tone === 'dark' ? 'border-white/20' : 'border-border',
        className
      )}
      role="group"
      aria-label={t('nav.language')}
    >
      {btn('en', 'EN')}
      {btn('ja', 'JA')}
    </div>
  );
}
