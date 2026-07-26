'use client';

import Image from 'next/image';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '@/i18n/locale-context';

/** Embeddable Needs You loop — GIF with reduced-motion still fallback. */
export function EmbeddableNeedsYou() {
  const t = useT();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-white/15 bg-black/40">
        {reduceMotion ? (
          <Image
            src="/demo/needs-you-moment.png"
            alt={t('moment.title')}
            width={960}
            height={542}
            className="w-full h-auto"
            priority
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/demo/needs-you.gif"
            alt={t('moment.embedTitle')}
            width={960}
            height={542}
            className="w-full h-auto"
          />
        )}
      </div>
      <figcaption className="text-xs text-white/50 leading-relaxed flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          <span className="font-medium text-white/70">{t('moment.embedTitle')}</span>
          {' — '}
          {t('moment.embedHint')}
        </span>
        <a
          href={reduceMotion ? '/demo/needs-you-moment.png' : '/demo/needs-you.gif'}
          download
          className="inline-flex items-center gap-1 text-white/80 underline underline-offset-2 hover:text-white"
        >
          <Download className="h-3 w-3" />
          {reduceMotion ? t('media.downloadStill') : t('media.downloadGif')}
        </a>
      </figcaption>
    </figure>
  );
}
