'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Rocket, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanTier, Template } from '@/lib/supabase/types';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale, useT } from '@/i18n/locale-context';
import { TEMPLATE_JA } from '@/lib/templates/ja-blurbs';
import { agentLabel, roleLabel } from '@/lib/templates/ja-overlays';
import { formatApiError } from '@/i18n/format-content';

export default function TemplatesPage() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plan, setPlan] = useState<PlanTier>('free');
  const [agentCount, setAgentCount] = useState(0);
  const [theme, setTheme] = useState(() => t('templatesExtra.chip1'));
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<{
    message: string;
    upgrade_to?: PlanTier;
    needed: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? data);
        if (data.plan) setPlan(data.plan);
        if (typeof data.agentCount === 'number') setAgentCount(data.agentCount);
      }
      setLoading(false);
    })();
  }, []);

  async function upgrade(to: PlanTier) {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: to }),
    });
    if (!res.ok) {
      toast.error(t('errors.upgradeFailed'));
      return;
    }
    setPlan(to);
    setLimitError(null);
    toast.success(t('errors.upgradedTo', { plan: t(`plan.${to}`) }));
  }

  async function launch(templateId: string) {
    if (!theme.trim()) {
      toast.error(t('templates.themeRequired'));
      return;
    }
    setLaunching(templateId);
    setLimitError(null);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, theme }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'PLAN_LIMIT' || data.code === 'USAGE_LIMIT') {
          setLimitError({
            message: formatApiError(data, t),
            upgrade_to: data.upgrade_to,
            needed: data.needed ?? 0,
          });
          return;
        }
        throw new Error(formatApiError(data, t) || t('errors.launchFailed'));
      }
      toast.success(t('templates.launched'));
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.launchFailed'));
    } finally {
      setLaunching(null);
    }
  }

  const limit = PLAN_LIMITS[plan].maxAgents;

  function templateDisplay(template: Template) {
    const ja = locale === 'ja' ? TEMPLATE_JA[template.id] : undefined;
    return {
      name: ja?.name ?? template.name,
      description: ja?.description ?? template.description,
    };
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('templates.title')}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{t('templates.blurb')}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {t('templates.planUsage', {
            plan: t(`plan.${plan}`),
            used: agentCount,
            limit,
          })}
        </p>
      </div>

      {limitError && (
        <div className="rounded-xl border border-urgent/40 bg-urgent/5 p-5 space-y-3">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-urgent mt-0.5" />
            <div>
              <p className="font-medium text-urgent">{t('templates.planLimit')}</p>
              <p className="text-sm text-muted-foreground mt-1">{limitError.message}</p>
            </div>
          </div>
          {limitError.upgrade_to && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => upgrade(limitError.upgrade_to!)}>
                {t('errors.upgradeToPrice', {
                  plan: t(`plan.${limitError.upgrade_to}`),
                  price: PLAN_LIMITS[limitError.upgrade_to].price,
                })}
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings">{t('templates.viewPlans')}</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="surface rounded-xl p-5 max-w-xl space-y-3">
        <Label htmlFor="theme">{t('templates.themeLabel')}</Label>
        <Input
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={t('templatesExtra.themePlaceholder')}
        />
        <div className="flex flex-wrap gap-2">
          {[
            t('templatesExtra.chip1'),
            t('templatesExtra.chip2'),
            t('templatesExtra.chip3'),
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setTheme(chip)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('templates.loading')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const slots = template.agent_definitions.length;
            const blocked = agentCount + slots > limit;
            const display = templateDisplay(template);
            return (
              <Card key={template.id} className="bg-card/90">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{display.name}</CardTitle>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {slots > 1
                        ? t('templates.agentsCount', { n: slots })
                        : t('templates.agentCount', { n: slots })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {display.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {template.agent_definitions.map((def) => (
                      <li
                        key={def.name}
                        className="text-sm flex items-start justify-between gap-3 border-t border-border pt-2"
                      >
                        <div>
                          <p className="font-medium">
                            {agentLabel(def.name, locale)}
                          </p>
                          <p className="text-muted-foreground">
                            {roleLabel(def.role, locale)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {def.escalation_conditions.length === 0
                            ? t('templates.asksWhenNeeded')
                            : def.escalation_conditions.length === 1
                              ? t('templates.decisionPoint', {
                                  n: def.escalation_conditions.length,
                                })
                              : t('templates.decisionPoints', {
                                  n: def.escalation_conditions.length,
                                })}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => launch(template.id)}
                    disabled={launching === template.id}
                    variant={blocked ? 'outline' : 'default'}
                  >
                    {launching === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : blocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Rocket className="h-4 w-4" />
                    )}
                    {blocked ? t('templates.needsUpgrade') : t('templates.launch')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
