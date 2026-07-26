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

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plan, setPlan] = useState<PlanTier>('free');
  const [agentCount, setAgentCount] = useState(0);
  const [theme, setTheme] = useState('AI agent orchestration market 2026');
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
      toast.error('Upgrade failed');
      return;
    }
    setPlan(to);
    setLimitError(null);
    toast.success(`Upgraded to ${PLAN_LIMITS[to].label}`);
  }

  async function launch(templateId: string) {
    if (!theme.trim()) {
      toast.error('Enter a research theme');
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
        if (data.code === 'PLAN_LIMIT') {
          setLimitError({
            message: data.error,
            upgrade_to: data.upgrade_to,
            needed: data.needed,
          });
          return;
        }
        throw new Error(data.error || 'Launch failed');
      }
      toast.success(`Crew launched (${data.agents.length} agents)`);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Launch failed');
    } finally {
      setLaunching(null);
    }
  }

  const limit = PLAN_LIMITS[plan].maxAgents;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Start from a proven crew. Free allows {PLAN_LIMITS.free.maxAgents} agents —
          use Solo Scout or Competitor Watch, or upgrade for Research Crew.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Plan: {PLAN_LIMITS[plan].label} · {agentCount}/{limit} agents used
        </p>
      </div>

      {limitError && (
        <div className="rounded-xl border border-urgent/40 bg-urgent/5 p-5 space-y-3">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-urgent mt-0.5" />
            <div>
              <p className="font-medium text-urgent">Plan limit</p>
              <p className="text-sm text-muted-foreground mt-1">{limitError.message}</p>
            </div>
          </div>
          {limitError.upgrade_to && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => upgrade(limitError.upgrade_to!)}>
                Upgrade to {PLAN_LIMITS[limitError.upgrade_to].label} ($
                {PLAN_LIMITS[limitError.upgrade_to].price}/mo)
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings">View plans</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="surface rounded-xl p-5 max-w-xl space-y-2">
        <Label htmlFor="theme">Mission theme</Label>
        <Input
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="What should the crew investigate?"
        />
      </div>

      {loading ? (
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading templates…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const slots = template.agent_definitions.length;
            const blocked = agentCount + slots > limit;
            return (
              <Card key={template.id} className="bg-card/90">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {slots} agent{slots > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {template.description}
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
                          <p className="font-medium">{def.name}</p>
                          <p className="text-muted-foreground">{def.role}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {def.escalation_conditions.length} triggers
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
                    {blocked ? 'Needs upgrade' : 'Launch crew'}
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
