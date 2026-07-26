'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/locale-context';

const stepKeys = ['onboarding.step1', 'onboarding.step2', 'onboarding.step3'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();

  async function skip() {
    await fetch('/api/onboarded', { method: 'POST' });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('onboarding.title')}</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">{t('onboarding.body')}</p>
      </div>

      <ol className="space-y-4">
        {stepKeys.map((stepKey, i) => (
          <li key={stepKey} className="flex gap-3">
            <span className="h-7 w-7 rounded-full bg-foreground text-background text-sm flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <p className="pt-1 text-sm leading-relaxed">{t(stepKey)}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/templates">{t('onboarding.launch')}</Link>
        </Button>
        <Button size="lg" variant="outline" type="button" onClick={skip}>
          {t('onboarding.skip')}
        </Button>
      </div>
    </div>
  );
}
