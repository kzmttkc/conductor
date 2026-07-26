import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NeedsYouMoment } from '@/components/marketing/NeedsYouMoment';
import { ShareButtons } from '@/components/marketing/ShareButtons';

const title = 'Needs You — Conductor escalation moment';
const description =
  'The core of Conductor: an agent pauses and asks for human judgment in under 3 seconds.';
const ogImage = '/og-needs-you.png';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

export default function DemoMomentPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#111_0%,#1a1515_40%,#121816_100%)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl tracking-tight">
            Conductor
          </Link>
          <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
            <Link href="/demo">Try live demo</Link>
          </Button>
        </div>

        <p className="mt-12 text-xs uppercase tracking-[0.2em] text-red-300/90">
          The moment that sells the product
        </p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-3 leading-tight">
          Needs You
        </h1>
        <p className="text-white/65 mt-4 max-w-xl leading-relaxed">
          Share this frame. An agent stops, surfaces a crisp decision, and waits —
          command without chaos.
        </p>

        <div className="mt-10">
          <NeedsYouMoment />
        </div>

        {/* Static GIF for embedding in posts when live UI is too tall */}
        <p className="mt-8 text-xs text-white/40">
          Embeddable loop:{' '}
          <a className="underline underline-offset-2 text-white/60" href="/demo/needs-you.gif">
            /demo/needs-you.gif
          </a>
        </p>

        <div className="mt-8">
          <ShareButtons path="/demo/moment" />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
            <Link href="/demo">Start public demo</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="/demo/moment#record">Recording tips</Link>
          </Button>
        </div>

        <section id="record" className="mt-16 border-t border-white/10 pt-8 space-y-3 text-sm text-white/60">
          <h2 className="text-white font-medium">For a 15–30s clip</h2>
          <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
            <li>Open <code className="text-white/80">/demo</code> and click Start public demo.</li>
            <li>Wait for the red command banner + Needs You card (~5s).</li>
            <li>Click Decide, press <kbd className="px-1 border border-white/20 rounded">A</kbd> to approve.</li>
            <li>Cut when the agent resumes / report appears in Results.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
