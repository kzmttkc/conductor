'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const router = useRouter();

  async function skip() {
    await fetch('/api/demo/onboarded', { method: 'POST' });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Welcome, Commander</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Conductor is not about making agents smarter. It is about making you
          able to trust and direct a team of them.
        </p>
      </div>

      <ol className="space-y-4">
        {[
          'Launch a template (Solo Scout on Free, or upgrade for Research Crew).',
          'Watch the dashboard — Running → Needs You. Decide in under 3 seconds.',
          'After completion, open Results to read the report your crew produced.',
        ].map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="h-7 w-7 rounded-full bg-foreground text-background text-sm flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <p className="pt-1 text-sm leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/templates">Launch your first crew</Link>
        </Button>
        <Button size="lg" variant="outline" type="button" onClick={skip}>
          Skip to dashboard
        </Button>
      </div>
    </div>
  );
}
