import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { BrandLockup } from '@/components/brand';
import { PricingSection } from '@/components/marketing/PricingSection';

export const metadata: Metadata = {
  title: 'Conductor — Command your AI agents',
  description:
    'One human. A crew of agents. Clear authority, full visibility, and escalations that respect your attention.',
  openGraph: {
    title: 'Conductor — Command your AI agents',
    description: 'Try the live demo — feel the Needs You moment in under a minute.',
    images: [{ url: '/og-needs-you.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conductor — Command your AI agents',
    description: 'Try the live demo — feel the Needs You moment in under a minute.',
    images: ['/og-needs-you.png'],
  },
};

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-[#f4f6f3] text-[#141414]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f4f6f3_0%,#e7eee8_45%,#dfe8e3_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,rgba(20,20,20,0.12)_1px,transparent_0)] bg-size-[22px_22px]" />
      </div>

      <div className="mx-auto max-w-5xl px-5 sm:px-6 pb-24 pt-12 sm:pt-16">
        <section className="max-w-3xl">
          <BrandLockup
            className="items-start gap-4"
            wordmarkAs="h1"
            markClassName="h-20 w-20 sm:h-24 sm:w-24 !text-[#001444]"
            wordmarkClassName="text-4xl sm:text-5xl md:text-6xl tracking-[0.2em] !text-[#001444]"
          />
          <p className="mt-8 text-lg md:text-xl text-[#6b6b66] max-w-xl text-balance">
            One human. A crew of agents. Clear authority, full visibility, and
            escalations that respect your attention.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-12 w-full sm:w-auto">
              <Link href="/demo">Try live demo — no signup</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-12 w-full sm:w-auto">
              <Link href="/demo/moment">See the Needs You moment</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-[#6b6b66]">
            Public URL: <code className="text-[#141414]">/demo</code> — share it anywhere.
          </p>
        </section>

        <section className="mt-20 sm:mt-28 grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Roles & permissions',
              body: 'Every agent knows what it may do — and what requires you.',
            },
            {
              title: 'Realtime visibility',
              body: 'Watch status, thoughts, and blockers as the crew works.',
            },
            {
              title: 'Human-in-the-loop',
              body: 'When judgment is needed, decide in seconds — then resume.',
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-[#e4e4e0] pt-5">
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-[#6b6b66] leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <PricingSection />
      </div>
    </div>
  );
}
