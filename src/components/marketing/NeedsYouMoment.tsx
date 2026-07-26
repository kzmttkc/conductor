'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLocale, useT } from '@/i18n/locale-context';
import { agentLabel, roleLabel } from '@/lib/templates/ja-overlays';
import { formatEscalationOption } from '@/i18n/format-content';

const OPTIONS_EN = [
  'Approve and continue with current direction',
  'Narrow scope to primary competitors only',
  'Pause and request deeper primary sources',
] as const;

export function NeedsYouMoment() {
  const t = useT();
  const { locale } = useLocale();
  const [pulse, setPulse] = useState(true);
  const [selected, setSelected] = useState(0);
  const [userPicked, setUserPicked] = useState(false);

  const options = OPTIONS_EN.map((opt) => formatEscalationOption(opt, t));
  const summary =
    locale === 'ja'
      ? '「AI agent orchestration」の市場規模でソースが矛盾しています。ある報告は $4.2B、別の報告は $2.8B です。どちらを主としますか？'
      : 'Sources conflict on market size for “AI agent orchestration”. One report cites $4.2B, another $2.8B. Which figure should I treat as primary?';

  useEffect(() => {
    const timer = setInterval(() => setPulse((p) => !p), 900);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (userPicked) return;
    const timer = setInterval(() => setSelected((s) => (s + 1) % OPTIONS_EN.length), 2200);
    return () => clearInterval(timer);
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
        toast.message(t('needsYou.recorded'), {
          description: options[selected],
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, options, t]);

  function pick(i: number) {
    setSelected(i);
    setUserPicked(true);
  }

  function decide() {
    setUserPicked(true);
    toast.message(t('needsYou.recorded'), {
      description: options[selected],
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161214] shadow-2xl overflow-hidden">
      <div
        className={cn(
          'px-4 py-3.5 md:px-5 flex items-center gap-2.5 text-white transition-colors duration-150',
          pulse ? 'bg-[#d64545]' : 'bg-[#b83636]'
        )}
      >
        <AlertTriangle className={cn('h-5 w-5 shrink-0', pulse && 'animate-pulse')} />
        <span className="font-bold uppercase tracking-[0.12em] text-[13px] md:text-sm">
          {t('needsYou.title')} · 1
        </span>
        <button
          type="button"
          onClick={decide}
          className="ml-auto min-h-11 px-4 rounded-md bg-white text-[#d64545] text-sm font-bold shadow-sm hover:bg-white/95 transition-colors duration-150"
        >
          {t('needsYou.approve')}
        </button>
      </div>

      <div className="p-5 md:p-7 space-y-5">
        <div className="flex items-center gap-2 text-xs text-white/45">
          <span className="text-white/70 font-medium">
            {agentLabel('Scout', locale)}
          </span>
          <span>·</span>
          <span>{roleLabel('Researcher', locale)}</span>
          <span className="ml-auto rounded bg-red-500/20 text-red-300 px-2 py-0.5 font-medium animate-pulse text-[11px]">
            {t('needsYou.title')}
          </span>
        </div>

        <h2 className="font-display text-[1.65rem] md:text-[2.15rem] leading-[1.15] tracking-tight text-balance text-white">
          {summary}
        </h2>

        <div className="space-y-2.5 pt-1" role="listbox" aria-label={t('needsYou.chooseDirection')}>
          {options.map((opt, i) => {
            const active = selected === i;
            return (
              <button
                key={OPTIONS_EN[i]}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(i)}
                className={cn(
                  'w-full text-left rounded-xl border px-4 py-3.5 text-sm transition-all duration-150 flex gap-3',
                  active
                    ? 'border-white bg-white text-[#161214] shadow-md'
                    : 'border-white/15 bg-white/5 text-white/85 hover:border-white/35'
                )}
              >
                <span
                  className={cn(
                    'h-7 w-7 shrink-0 rounded-lg text-xs font-bold flex items-center justify-center',
                    active ? 'bg-[#161214]/10' : 'bg-white/10 text-white/60'
                  )}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
