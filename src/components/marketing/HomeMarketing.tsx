'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandWordmark } from '@/components/brand';
import { PricingSection } from '@/components/marketing/PricingSection';
import { useT } from '@/i18n/locale-context';

export function HomeMarketing() {
  const t = useT();

  return (
    <div className="relative overflow-hidden bg-[#f4f6f3] text-[#141414]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f4f6f3_0%,#e7eee8_45%,#dfe8e3_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,rgba(20,20,20,0.12)_1px,transparent_0)] bg-size-[22px_22px]" />
      </div>

      <div className="mx-auto max-w-5xl px-5 sm:px-6 pb-24 pt-12 sm:pt-16">
        <section className="max-w-3xl">
          <BrandWordmark
            as="h1"
            className="text-4xl sm:text-5xl md:text-6xl tracking-[0.2em] !text-[#001444]"
          />
          <p className="mt-8 text-lg md:text-xl text-[#6b6b66] max-w-xl text-balance">
            {t('brand.tagline')} {t('brand.outcome')}
          </p>
          <p className="mt-4 text-sm md:text-[15px] text-[#6b6b66] max-w-xl leading-relaxed text-balance">
            {t('home.clarity')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="min-h-12 w-full sm:w-auto bg-[#141414] text-[#fafafa] hover:bg-[#141414]/90"
            >
              <Link href="/demo">{t('home.ctaDemo')}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-12 w-full sm:w-auto border-[#c8c8c2] bg-transparent text-[#141414] hover:bg-[#141414]/5"
            >
              <Link href="/demo/moment">{t('home.ctaMoment')}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-[#6b6b66]">{t('home.shareHint')}</p>
        </section>

        <figure className="mt-12 sm:mt-16 max-w-xl mx-auto md:mx-0">
          <Link
            href="/demo/moment"
            className="block overflow-hidden rounded-xl border border-[#e4e4e0] bg-white shadow-[0_8px_24px_-12px_rgba(20,20,20,0.18)] transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001444]/40"
          >
            <Image
              src="/demo/needs-you-moment.png"
              alt={t('home.momentCaption')}
              width={960}
              height={720}
              className="w-full h-auto"
              priority
            />
          </Link>
          <figcaption className="mt-3 text-xs text-[#6b6b66] text-center md:text-left">
            {t('home.momentCaption')}
          </figcaption>
        </figure>

        <section className="mt-20 sm:mt-28 grid gap-8 md:grid-cols-3">
          {[
            { title: t('home.rolesTitle'), body: t('home.rolesBody') },
            { title: t('home.visibilityTitle'), body: t('home.visibilityBody') },
            { title: t('home.hitlTitle'), body: t('home.hitlBody') },
          ].map((item) => (
            <div key={item.title} className="border-t border-[#e4e4e0] pt-5">
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-[#6b6b66] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </section>

        <PricingSection />
      </div>
    </div>
  );
}
