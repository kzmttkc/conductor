'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useT } from '@/i18n/locale-context';

const DEFAULT_TIP_KEY = 'conductor-tip-escalation-dismissed';

/** Coach on Needs You — public demo params OR first-time local visitors. */
export function DecisionCoach({ tipKey = DEFAULT_TIP_KEY }: { tipKey?: string }) {
  const params = useSearchParams();
  const t = useT();
  const fromTour =
    params.get('tour') === '1' || params.get('src') === 'public-demo';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (fromTour) {
      setShow(true);
      return;
    }
    try {
      const seen =
        localStorage.getItem(tipKey) ||
        localStorage.getItem('conductor-decision-coach-seen') ||
        localStorage.getItem('conductor-esc-hint-seen');
      if (!seen) setShow(true);
    } catch {
      setShow(true);
    }
  }, [fromTour, tipKey]);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(tipKey, '1');
      localStorage.setItem('conductor-decision-coach-seen', '1');
      localStorage.setItem('conductor-esc-hint-seen', '1');
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex gap-3 items-start">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium">{t('needsYou.coachTitle')}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('needsYou.coachBody')}
        </p>
        <p className="text-xs text-muted-foreground pt-1">{t('needsYou.hintShortcuts')}</p>
      </div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground min-h-11 min-w-11 inline-flex items-center justify-center"
        aria-label={t('needsYou.gotIt')}
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
