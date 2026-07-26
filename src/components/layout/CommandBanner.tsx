'use client';

import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useEscalations } from '@/hooks/useEscalations';

export function CommandBanner({ userId }: { userId: string }) {
  const { escalations } = useEscalations(userId);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const playedFor = useRef<Set<string>>(new Set());
  const top = escalations[0];

  useEffect(() => {
    if (!top || playedFor.current.has(top.id)) return;
    playedFor.current.add(top.id);
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // audio optional
    }
  }, [top]);

  if (!top || dismissed === top.id) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-urgent/40 bg-urgent text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Needs you · {escalations.length} pending
          </p>
          <p className="text-sm truncate">{top.summary}</p>
        </div>
        <Link
          href={`/escalations/${top.id}`}
          className="shrink-0 rounded-md bg-white text-urgent text-xs font-semibold px-3 py-1.5 hover:bg-white/90"
        >
          Decide
        </Link>
        <button
          type="button"
          aria-label="Dismiss banner"
          className="opacity-80 hover:opacity-100"
          onClick={() => setDismissed(top.id)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
