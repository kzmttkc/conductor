'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NeedsYouMoment } from '@/components/marketing/NeedsYouMoment';
import { EmbeddableNeedsYou } from '@/components/marketing/EmbeddableNeedsYou';
import { ShareButtons } from '@/components/marketing/ShareButtons';
import { useT } from '@/i18n/locale-context';

export function MomentMarketing() {
  const t = useT();

  return (
    <div className="bg-[linear-gradient(180deg,#111_0%,#1a1515_40%,#121816_100%)] text-white">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-10 md:py-14 pb-16">
        <p className="text-xs uppercase tracking-[0.2em] text-red-300/90">
          {t('moment.eyebrow')}
        </p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-3 leading-tight">
          {t('moment.title')}
        </h1>
        <p className="text-white/65 mt-4 max-w-xl leading-relaxed">{t('moment.body')}</p>

        <div className="mt-8 sm:mt-10">
          <NeedsYouMoment />
        </div>

        <div className="mt-10">
          <EmbeddableNeedsYou />
        </div>

        <p className="mt-8 text-xs text-white/50 leading-relaxed">{t('moment.recordHint')}</p>

        <div className="mt-8">
          <ShareButtons path="/demo/moment" />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="min-h-12 w-full sm:w-auto bg-white text-black hover:bg-white/90"
          >
            <Link href="/demo">{t('moment.startDemo')}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-h-12 w-full sm:w-auto border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="/demo/moment#record">{t('moment.recordTips')}</Link>
          </Button>
        </div>

        <section
          id="record"
          className="mt-16 border-t border-white/10 pt-8 space-y-3 text-sm text-white/60"
        >
          <h2 className="text-white font-medium">{t('moment.recordTitle')}</h2>
          <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
            <li>{t('moment.step1')}</li>
            <li>{t('moment.step2')}</li>
            <li>{t('moment.step3')}</li>
            <li>{t('moment.step4')}</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
