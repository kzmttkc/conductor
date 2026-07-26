'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { X } from 'lucide-react';

/** One-line coach on the Needs You decision screen for public demo visitors. */
export function DecisionCoach() {
  const params = useSearchParams();
  const active =
    params.get('tour') === '1' || params.get('src') === 'public-demo';
  const [dismissed, setDismissed] = useState(false);

  if (!active || dismissed) return null;

  return (
    <div className="rounded-xl border border-white/20 bg-black/30 text-white p-4 flex gap-3 items-start">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium">Demo tip</p>
        <p className="text-sm text-white/75 leading-relaxed">
          Pick an option (or press <kbd className="px-1 border border-white/30 rounded">A</kbd>{' '}
          to approve). That&apos;s the core of Conductor — you decide, the agent resumes.
        </p>
      </div>
      <button
        type="button"
        className="text-white/60 hover:text-white"
        aria-label="Dismiss tip"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
