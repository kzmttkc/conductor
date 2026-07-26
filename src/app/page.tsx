import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Conductor — Command your AI agents',
  description:
    'One human. A crew of agents. Clear authority, full visibility, and escalations that respect your attention.',
  openGraph: {
    title: 'Conductor — Command your AI agents',
    description: 'Try the live demo — feel the Needs You moment in under a minute.',
    images: [{ url: '/og-needs-you.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conductor — Command your AI agents',
    description: 'Try the live demo — feel the Needs You moment in under a minute.',
    images: ['/og-needs-you.svg'],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f4f6f3_0%,#e7eee8_45%,#dfe8e3_100%)] dark:bg-[linear-gradient(180deg,#0d1010_0%,#121816_50%,#0e1211_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2] bg-[radial-gradient(circle_at_1px_1px,rgba(20,20,20,0.12)_1px,transparent_0)] bg-size-[22px_22px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-10 pb-20">
        <nav className="flex items-center justify-between">
          <p className="font-display text-2xl tracking-tight">Conductor</p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/demo/moment">Needs You</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </nav>

        <section className="mt-24 md:mt-32 max-w-3xl">
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance">
            Conductor
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl text-balance">
            One human. A crew of agents. Clear authority, full visibility, and
            escalations that respect your attention.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/demo">Try live demo — no signup</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo/moment">See the Needs You moment</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Public URL: <code className="text-foreground">/demo</code> — share it anywhere.
          </p>
        </section>

        <section className="mt-28 grid gap-8 md:grid-cols-3">
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
            <div key={item.title} className="border-t border-border pt-5">
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
