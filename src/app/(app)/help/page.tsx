'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/locale-context';

const conceptKeys = [
  {
    titleKey: 'help.agentsTitle',
    bodyKey: 'help.agentsBody',
  },
  {
    titleKey: 'help.templatesTitle',
    bodyKey: 'help.templatesBody',
  },
  {
    titleKey: 'help.needsTitle',
    bodyKey: 'help.needsBody',
  },
  {
    titleKey: 'help.resultsTitle',
    bodyKey: 'help.resultsBody',
  },
] as const;

export default function HelpPage() {
  const t = useT();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('help.title')}</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">{t('help.intro')}</p>
      </div>

      <div className="space-y-6">
        {conceptKeys.map((item) => (
          <section key={item.titleKey} className="surface rounded-xl p-5 space-y-2">
            <h2 className="font-medium">{t(item.titleKey)}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(item.bodyKey)}</p>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/templates">{t('help.browseTemplates')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">{t('help.goDashboard')}</Link>
        </Button>
      </div>
    </div>
  );
}
