'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PLAN_LIMITS, type PlanTier } from '@/lib/supabase/types';

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState<{
    message: string;
    upgrade_to?: PlanTier;
  } | null>(null);
  const [form, setForm] = useState({
    name: '',
    role: '',
    goal: '',
    start: true,
  });

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
    setLimitError(null);
    toast.success(`Upgraded to ${PLAN_LIMITS[to].label}`);
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
          config: { goal: form.goal, theme: form.goal },
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
        if (data.code === 'PLAN_LIMIT') {
          setLimitError({ message: data.error, upgrade_to: data.upgrade_to });
          return;
        }
        throw new Error(data.error || 'Failed');
      }
      toast.success(`${form.name} created`);
      router.push(`/agents/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight">New agent</h1>
        <p className="text-muted-foreground mt-2">
          Define a clear role, goal, and starting posture.
        </p>
      </div>

      {limitError && (
        <div className="rounded-xl border border-urgent/40 bg-urgent/5 p-4 space-y-3">
          <p className="text-sm text-urgent font-medium">{limitError.message}</p>
          {limitError.upgrade_to && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => upgrade(limitError.upgrade_to!)}>
                Upgrade to {PLAN_LIMITS[limitError.upgrade_to].label}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">Plans</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="surface rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Scout"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="Researcher"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">Goal / current task</Label>
          <Textarea
            id="goal"
            value={form.goal}
            onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
            placeholder="Collect primary sources on…"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.start}
            onChange={(e) => setForm((f) => ({ ...f, start: e.target.checked }))}
          />
          Start immediately
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating…' : 'Create agent'}
        </Button>
      </form>
    </div>
  );
}
