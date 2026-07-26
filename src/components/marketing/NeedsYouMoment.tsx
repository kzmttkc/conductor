'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NeedsYouMoment() {
  const [pulse, setPulse] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 900);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 3), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161214] shadow-2xl overflow-hidden">
      <div
        className={cn(
          'px-4 py-2.5 flex items-center gap-2 text-sm transition-colors',
          pulse ? 'bg-[#d64545]' : 'bg-[#c23b3b]'
        )}
      >
        <AlertTriangle className={cn('h-4 w-4', pulse && 'animate-pulse')} />
        <span className="font-semibold uppercase tracking-wide text-xs">
          Needs you · 1 pending
        </span>
        <span className="ml-auto text-xs bg-white text-[#d64545] font-semibold rounded px-2 py-0.5">
          Decide
        </span>
      </div>

      <div className="p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="text-white/80 font-medium">Scout</span>
          <span>·</span>
          <span>Researcher</span>
          <span className="ml-auto rounded bg-red-500/20 text-red-300 px-2 py-0.5 font-medium animate-pulse">
            Needs You
          </span>
        </div>

        <h2 className="font-display text-2xl md:text-3xl leading-tight tracking-tight text-balance">
          Sources conflict on market size for “AI agent orchestration”. One
          report cites $4.2B, another $2.8B. Which figure should I treat as
          primary?
        </h2>

        <div className="space-y-2 pt-2">
          {[
            'Approve and continue with current direction',
            'Narrow scope to primary competitors only',
            'Pause and request deeper primary sources',
          ].map((opt, i) => (
            <div
              key={opt}
              className={cn(
                'rounded-xl border px-4 py-3 text-sm transition-all duration-500',
                step === i
                  ? 'border-white bg-white text-black scale-[1.01]'
                  : 'border-white/15 text-white/75'
              )}
            >
              <span className="opacity-60 mr-2">{i + 1}</span>
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
