'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { UsageMeters } from '@/components/usage/UsageMeters';
import { PLAN_LIMITS, type PlanTier, type UsageStats } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/locale-context';
import {
  PREFER_JA_SOURCES_COOKIE,
  PREFER_STRUCTURED_JA_COOKIE,
} from '@/i18n/types';
import {
  downloadAgentLabelsJa,
  parseAgentLabelsJson,
  readAgentLabelsJa,
  writeAgentLabelsJa,
} from '@/i18n/agent-labels-client';
import { Textarea } from '@/components/ui/textarea';

const plans: PlanTier[] = ['free', 'starter', 'pro', 'scale'];

function mapToLines(map: Record<string, string>) {
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function linesToMap(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();
  const [plan, setPlan] = useState<PlanTier>('free');
  const [agentCount, setAgentCount] = useState(0);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [runtime, setRuntime] = useState<{ llmEnabled: boolean; provider: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [preferJaSources, setPreferJaSources] = useState(false);
  const [preferStructuredJa, setPreferStructuredJa] = useState(false);
  const [labelsText, setLabelsText] = useState('');
  const labelsFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const ja = document.cookie.match(
        new RegExp(`(?:^|; )${PREFER_JA_SOURCES_COOKIE}=([^;]*)`)
      );
      setPreferJaSources(ja?.[1] === '1');
      const structured = document.cookie.match(
        new RegExp(`(?:^|; )${PREFER_STRUCTURED_JA_COOKIE}=([^;]*)`)
      );
      setPreferStructuredJa(structured?.[1] === '1');
      setLabelsText(mapToLines(readAgentLabelsJa()));
    } catch {
      // ignore
    }
  }, []);

  function togglePreferJaSources() {
    const next = !preferJaSources;
    setPreferJaSources(next);
    document.cookie = `${PREFER_JA_SOURCES_COOKIE}=${next ? '1' : '0'};path=/;max-age=31536000;samesite=lax`;
    toast.success(t('settings.preferJaSourcesSaved'));
  }

  function togglePreferStructuredJa() {
    const next = !preferStructuredJa;
    setPreferStructuredJa(next);
    document.cookie = `${PREFER_STRUCTURED_JA_COOKIE}=${next ? '1' : '0'};path=/;max-age=31536000;samesite=lax`;
    toast.success(t('settings.preferStructuredJaSaved'));
  }

  function saveAgentLabels() {
    writeAgentLabelsJa(linesToMap(labelsText));
    toast.success(t('settings.agentLabelsSaved'));
  }

  function exportAgentLabels() {
    const map = linesToMap(labelsText);
    writeAgentLabelsJa(map);
    downloadAgentLabelsJa(map);
    toast.success(t('settings.agentLabelsExported'));
  }

  function importAgentLabels(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseAgentLabelsJson(String(reader.result ?? ''));
      if (!parsed) {
        toast.error(t('settings.agentLabelsImportFailed'));
        return;
      }
      writeAgentLabelsJa(parsed);
      setLabelsText(mapToLines(parsed));
      toast.success(t('settings.agentLabelsImported'));
    };
    reader.readAsText(file);
  }

  function planName(p: PlanTier) {
    return t(`plan.${p}`);
  }

  async function refresh() {
    const res = await fetch('/api/plan');
    if (res.ok) {
      const data = await res.json();
      setPlan(data.plan);
      setAgentCount(data.agentCount);
      setUsage(data.usage);
      setRuntime(data.runtime);
    }
    setLoading(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      toast.success(t('settings.checkoutSuccess'));
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refresh();
  }, []);

  async function choose(next: PlanTier) {
    if (next !== 'free') {
      const stripeRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      });
      if (stripeRes.ok) {
        const data = await stripeRes.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    }

    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: next }),
    });
    if (!res.ok) {
      toast.error(t('settings.planUpdateFailed'));
      return;
    }
    setPlan(next);
    toast.success(
      next === 'free'
        ? t('settings.switchedFree')
        : t('settings.planActivated', { plan: planName(next) })
    );
  }

  async function resetDemo() {
    if (!confirm(t('settings.resetConfirm'))) return;
    setResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      await refresh();
      toast.success(t('settings.resetDone'));
      router.push('/onboarding');
      router.refresh();
    } catch {
      toast.error(t('settings.resetFailed'));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
        <Link
          href="/templates"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-foreground/30 transition-colors"
        >
          {t('settings.templatesLink')}
          <span className="text-muted-foreground font-normal">{t('settings.launchAnother')}</span>
        </Link>
      </div>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">{t('settings.currentUsage')}</h2>
        <p className="text-sm text-muted-foreground">
          {loading
            ? t('common.loading')
            : t('settings.planAgentsInUse', {
                plan: planName(plan),
                used: agentCount,
                max: PLAN_LIMITS[plan].maxAgents,
              })}
        </p>
        {usage && <UsageMeters plan={plan} usage={usage} agentCount={agentCount} />}
        {usage && (
          <p className="text-xs text-muted-foreground">
            {t('settings.toolCalls', { n: usage.toolCalls })}
          </p>
        )}
        {runtime && (
          <p className="text-xs text-muted-foreground pt-1">
            {t('settings.aiMode')}{' '}
            {runtime.llmEnabled
              ? t('settings.aiConnected', { provider: runtime.provider })
              : t('settings.aiStructured')}
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {plans.map((p) => {
          const meta = PLAN_LIMITS[p];
          const active = plan === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => choose(p)}
              className={cn(
                'text-left rounded-xl border p-5 transition-all',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card hover:border-foreground/30'
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium">{planName(p)}</p>
                <p className="text-sm">
                  {meta.price === 0 ? '$0' : `$${meta.price}`}
                  {meta.price > 0 && (
                    <span className={active ? 'opacity-70' : 'text-muted-foreground'}>
                      {t('pricing.perMo')}
                    </span>
                  )}
                </p>
              </div>
              <p className={`text-sm mt-2 ${active ? 'opacity-80' : 'text-muted-foreground'}`}>
                {t('settings.planLimits', {
                  agents: meta.maxAgents,
                  runs: meta.maxAgentRuns,
                })}
              </p>
              {active && <p className="text-xs mt-3 opacity-70">{t('settings.currentPlan')}</p>}
            </button>
          );
        })}
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">{t('settings.preferJaSources')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('settings.preferJaSourcesBody')}
        </p>
        <Button type="button" variant="outline" onClick={togglePreferJaSources}>
          {preferJaSources
            ? t('settings.preferJaSourcesOn')
            : t('settings.preferJaSourcesOff')}
        </Button>
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">{t('settings.preferStructuredJa')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('settings.preferStructuredJaBody')}
        </p>
        <Button type="button" variant="outline" onClick={togglePreferStructuredJa}>
          {preferStructuredJa
            ? t('settings.preferStructuredJaOn')
            : t('settings.preferStructuredJaOff')}
        </Button>
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">{t('settings.agentLabels')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('settings.agentLabelsBody')}
        </p>
        <Textarea
          value={labelsText}
          onChange={(e) => setLabelsText(e.target.value)}
          placeholder={t('settings.agentLabelsPh')}
          className="min-h-[110px] font-mono text-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={saveAgentLabels}>
            {t('settings.agentLabelsSave')}
          </Button>
          <Button type="button" variant="outline" onClick={exportAgentLabels}>
            {t('settings.agentLabelsExport')}
          </Button>
          <input
            ref={labelsFileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              importAgentLabels(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => labelsFileRef.current?.click()}
          >
            {t('settings.agentLabelsImport')}
          </Button>
        </div>
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">{t('settings.billing')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('settings.billingBody')}</p>
        <Accordion type="single" collapsible>
          <AccordionItem value="developer" className="border-none">
            <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
              {t('settings.developer')}
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2">
              <p>{t('settings.developerStripe')}</p>
              <p>
                <code>{t('settings.developerWebhook')}</code>
              </p>
              <p>{t('settings.developerLlm')}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">{t('settings.resetHeading')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('settings.resetDemoBody')}
        </p>
        <Button variant="destructive" onClick={resetDemo} disabled={resetting}>
          {resetting ? t('settings.resetting') : t('settings.resetDemo')}
        </Button>
      </section>
    </div>
  );
}
