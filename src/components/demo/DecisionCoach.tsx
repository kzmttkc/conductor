'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useT } from '@/i18n/locale-context';

const KEY = 'conductor-decision-coach-seen';

/** Coach on Needs You — public demo params OR first-time local visitors. */
export function DecisionCoach() {
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
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, [fromTour]);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
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
      </div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
