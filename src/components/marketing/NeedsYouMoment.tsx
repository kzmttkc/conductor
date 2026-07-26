'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const OPTIONS = [
  'Approve and continue with current direction',
  'Narrow scope to primary competitors only',
  'Pause and request deeper primary sources',
] as const;

export function NeedsYouMoment() {
  const [pulse, setPulse] = useState(true);
  const [selected, setSelected] = useState(0);
  const [userPicked, setUserPicked] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 900);
    return () => clearInterval(t);
  }, []);

  // Auto-demo cycle until the visitor picks an option
  useEffect(() => {
    if (userPicked) return;
    const t = setInterval(() => setSelected((s) => (s + 1) % OPTIONS.length), 2200);
    return () => clearInterval(t);
  }, [userPicked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '3') {
        const idx = Number(e.key) - 1;
        setSelected(idx);
        setUserPicked(true);
      }
      if (e.key === 'a' || e.key === 'A' || e.key === 'Enter') {
        e.preventDefault();
        setUserPicked(true);
        toast.message('Decision locked', {
          description: OPTIONS[selected],
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  function pick(i: number) {
    setSelected(i);
    setUserPicked(true);
  }

  function decide() {
    setUserPicked(true);
    toast.message('Decision locked', {
      description: OPTIONS[selected],
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161214] shadow-2xl overflow-hidden">
      {/* Strongest visual element on the page */}
      <div
        className={cn(
          'px-4 py-3.5 md:px-5 flex items-center gap-2.5 text-white transition-colors duration-150',
          pulse ? 'bg-[#d64545]' : 'bg-[#b83636]'
        )}
      >
        <AlertTriangle className={cn('h-5 w-5 shrink-0', pulse && 'animate-pulse')} />
        <span className="font-bold uppercase tracking-[0.12em] text-[13px] md:text-sm">
          Needs you · 1 pending
        </span>
        <button
          type="button"
          onClick={decide}
          className="ml-auto min-h-11 px-4 rounded-md bg-white text-[#d64545] text-sm font-bold shadow-sm hover:bg-white/95 transition-colors duration-150"
        >
          Decide
        </button>
      </div>

      <div className="p-5 md:p-7 space-y-5">
        <div className="flex items-center gap-2 text-xs text-white/45">
          <span className="text-white/70 font-medium">Scout</span>
          <span>·</span>
          <span>Researcher</span>
          <span className="ml-auto rounded bg-red-500/20 text-red-300 px-2 py-0.5 font-medium animate-pulse text-[11px]">
            Needs You
          </span>
        </div>

        <h2 className="font-display text-[1.65rem] md:text-[2.15rem] leading-[1.15] tracking-tight text-balance text-white">
          Sources conflict on market size for “AI agent orchestration”. One
          report cites $4.2B, another $2.8B. Which figure should I treat as
          primary?
        </h2>

        <div className="space-y-2.5 pt-1" role="listbox" aria-label="Decision options">
          {OPTIONS.map((opt, i) => {
            const active = selected === i;
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(i)}
                className={cn(
                  'w-full min-h-12 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150 flex items-center gap-3',
                  active
                    ? 'border-white bg-white text-black scale-[1.01] shadow-md'
                    : 'border-white/15 bg-white/[0.03] text-white/75 hover:border-white/35 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                )}
              >
                <span
                  className={cn(
                    'h-8 w-8 shrink-0 rounded-lg text-sm font-bold flex items-center justify-center',
                    active ? 'bg-black/10' : 'bg-white/10 text-white/70'
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex-1 leading-snug pt-0.5">{opt}</span>
                <kbd
                  className={cn(
                    'hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                    active ? 'border-black/20 text-black/55' : 'border-white/20 text-white/40'
                  )}
                >
                  {i + 1}
                </kbd>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-white/40 pt-1">
          Press number or{' '}
          <kbd className="px-1 border border-white/20 rounded text-white/55">A</kbd> to
          approve
        </p>
      </div>
    </div>
  );
}
