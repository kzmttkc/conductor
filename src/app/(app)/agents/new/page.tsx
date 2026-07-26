'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PlanTier } from '@/lib/supabase/types';
import { useT } from '@/i18n/locale-context';
import { formatApiError } from '@/i18n/format-content';

export default function NewAgentPage() {
  const router = useRouter();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState<{
    message: string;
    upgrade_to?: PlanTier;
  } | null>(null);
  const [form, setForm] = useState({
    name: '',
    displayNameJa: '',
    role: '',
    goal: '',
    start: true,
  });

  function planName(p: PlanTier) {
    return t(`plan.${p}`);
  }

  async function upgrade(to: PlanTier) {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: to }),
    });
    if (!res.ok) {
      toast.error(t('agentsNew.upgradeFailed'));
      return;
    }
    setLimitError(null);
    toast.success(t('agentsNew.upgraded', { plan: planName(to) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLimitError(null);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          current_task: form.goal,
          config: {
            goal: form.goal,
            theme: form.goal,
            ...(form.displayNameJa.trim()
              ? { display_name_ja: form.displayNameJa.trim() }
              : {}),
          },
          permissions: {
            web_search: 'allow',
            browser: 'require_approval',
            file_write: 'deny',
          },
          start: form.start,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'PLAN_LIMIT' || data.code === 'USAGE_LIMIT') {
          setLimitError({
            message: formatApiError(data, t),
            upgrade_to: data.upgrade_to,
          });
          return;
        }
        throw new Error(formatApiError(data, t) || t('agentsNew.failed'));
      }
      toast.success(
        t('agentsNew.created', {
          name: form.displayNameJa.trim() || form.name,
        })
      );
      router.push(`/agents/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('agentsNew.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('agentsNew.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('agentsNew.subtitle')}</p>
      </div>

      {limitError && (
        <div className="rounded-xl border border-urgent/40 bg-urgent/5 p-4 space-y-3">
          <p className="text-sm text-urgent font-medium">{limitError.message}</p>
          {limitError.upgrade_to && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => upgrade(limitError.upgrade_to!)}>
                {t('agentsNew.upgradeTo', { plan: planName(limitError.upgrade_to) })}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">{t('agentsNew.plans')}</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="surface rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('agentsNew.name')}</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('agentsNew.namePh')}
            required
          />
          <p className="text-xs text-muted-foreground">{t('agentsNew.nameHint')}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayNameJa">{t('agentsNew.displayNameJa')}</Label>
          <Input
            id="displayNameJa"
            value={form.displayNameJa}
            onChange={(e) =>
              setForm((f) => ({ ...f, displayNameJa: e.target.value }))
            }
            placeholder={t('agentsNew.displayNameJaPh')}
          />
          <p className="text-xs text-muted-foreground">
            {t('agentsNew.displayNameJaHint')}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">{t('agentsNew.role')}</Label>
          <Input
            id="role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder={t('agentsNew.rolePh')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">{t('agentsNew.goal')}</Label>
          <Textarea
            id="goal"
            value={form.goal}
            onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
            placeholder={t('agentsNew.goalPh')}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.start}
            onChange={(e) => setForm((f) => ({ ...f, start: e.target.checked }))}
          />
          {t('agentsNew.startNow')}
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('agentsNew.creating') : t('agentsNew.create')}
        </Button>
      </form>
    </div>
  );
}
