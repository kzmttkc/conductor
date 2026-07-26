'use client';

import { useT } from '@/i18n/locale-context';

export function SkipLink() {
  const t = useT();

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
    >
      {t('skip')}
    </a>
  );
}
