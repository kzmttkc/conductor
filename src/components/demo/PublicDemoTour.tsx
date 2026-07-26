'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useEscalations } from '@/hooks/useEscalations';

export function PublicDemoTour({ userId }: { userId: string }) {
  const params = useSearchParams();
  const active = params.get('tour') === '1';
  const { escalations } = useEscalations(userId);
  const [dismissed, setDismissed] = useState(false);
  const pending = escalations[0];

  useEffect(() => {
    if (!active) return;
    // Soft highlight via document title when escalation lands
    if (pending) {
      document.title = `Needs You — Conductor`;
    }
  }, [active, pending]);

  if (!active || dismissed) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-6 flex gap-3 items-start">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium">Public demo tour</p>
        <p className="text-sm text-muted-foreground">
          {pending ? (
            <>
              Scout needs you.{' '}
              <Link
                href={`/escalations/${pending.id}`}
                className="text-urgent font-medium underline underline-offset-2"
              >
                Open Needs You
              </Link>{' '}
              — decide in under 3 seconds.
            </>
          ) : (
            <>Scout is running. Wait a few seconds for the red Needs You banner.</>
          )}
        </p>
      </div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        aria-label="Dismiss tour"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
