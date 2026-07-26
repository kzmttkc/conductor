'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  Agent,
  AgentLog,
  Artifact,
  Escalation,
  PermissionLevel,
  ToolName,
} from '@/lib/supabase/types';
import { TOOL_NAMES } from '@/lib/supabase/types';
import { AgentStatusBadge } from '@/components/agents/AgentStatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatRelativeTime } from '@/lib/utils';

const PERM_OPTIONS: { value: PermissionLevel; label: string }[] = [
  { value: 'allow', label: 'Allow' },
  { value: 'require_approval', label: 'Ask me' },
  { value: 'deny', label: 'Deny' },
];

export function AgentDetailView({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAgent(data.agent);
    setLogs(data.logs);
    setEscalations(data.escalations);
    setArtifacts(data.artifacts ?? []);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 1500);
    return () => clearInterval(t);
  }, [load]);

  async function control(
    action: 'start' | 'stop' | 'recover',
    extra?: { allow_web_search?: boolean }
  ) {
    const res = await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Control failed');
      return;
    }
    setAgent(await res.json());
    toast.success(
      action === 'start'
        ? 'Agent started — new permissions apply now'
        : action === 'stop'
          ? 'Agent stopped'
          : 'Retrying with current permissions…'
    );
    void load();
  }

  async function setPermission(tool: ToolName, level: PermissionLevel) {
    if (!agent) return;
    const permissions = { ...agent.permissions, [tool]: level };
    const res = await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
    if (!res.ok) {
      toast.error('Could not update permissions');
      return;
    }
    setAgent(await res.json());
    toast.success(
      `${tool.replaceAll('_', ' ')} → ${
        level === 'require_approval' ? 'Ask me' : level === 'allow' ? 'Allow' : 'Deny'
      }`
    );
  }

  async function remove() {
    if (!confirm('Delete this agent?')) return;
    const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    toast.success('Agent removed');
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className="flex items-center text-muted-foreground py-20">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading agent…
      </div>
    );
  }

  if (!agent) {
    return <p className="text-muted-foreground">Agent not found.</p>;
  }

  const pending = escalations.find((e) => e.status === 'pending');
  const report = artifacts[0];

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="grid gap-4 xl:grid-cols-12 xl:min-h-[72vh]">
        {/* Col 1 — Identity, permissions, controls */}
        <section className="xl:col-span-3 surface rounded-xl p-5 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="font-display text-3xl tracking-tight leading-none">
                {agent.name}
              </h1>
              <AgentStatusBadge status={agent.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{agent.role}</p>
          </div>

          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Current task
            </p>
            <p className="text-sm mt-1.5 leading-relaxed">
              {agent.current_task || 'Standing by'}
            </p>
          </div>

          <div>
            <h2 className="font-medium mb-1">Permissions</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Allow / Ask me / Deny — enforced at runtime.
            </p>
            <div className="space-y-4">
              {TOOL_NAMES.map((tool) => {
                const value = (agent.permissions?.[tool] as PermissionLevel) || 'deny';
                return (
                  <div key={tool} className="space-y-1.5">
                    <Label className="capitalize text-xs">
                      {tool.replaceAll('_', ' ')}
                    </Label>
                    <div className="grid grid-cols-3 gap-1">
                      {PERM_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPermission(tool, opt.value)}
                          className={cn(
                            'rounded-md border px-1.5 py-1.5 text-[11px] font-medium transition-colors',
                            value === opt.value
                              ? opt.value === 'deny'
                                ? 'border-urgent bg-urgent text-white'
                                : opt.value === 'require_approval'
                                  ? 'border-warning bg-warning/15 text-warning'
                                  : 'border-success bg-success text-white'
                              : 'border-border text-muted-foreground hover:border-foreground/30'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => control('start')}>
              <Play className="h-4 w-4" />
              Start
            </Button>
            <Button variant="outline" size="sm" onClick={() => control('stop')}>
              <Square className="h-4 w-4" />
              Stop
            </Button>
            {agent.status === 'error' && (
              <>
                <Button variant="success" size="sm" onClick={() => control('recover')}>
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => control('recover', { allow_web_search: true })}
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry + Allow search
                </Button>
              </>
            )}
            <Button variant="destructive" size="sm" onClick={remove}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          {Boolean(agent.config.pipeline) && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pipeline step {(Number(agent.config.pipeline_index) || 0) + 1}
              {agent.config.pipeline_next
                ? ' — next agent reads this report when complete.'
                : ' — final stage.'}
            </p>
          )}
        </section>

        {/* Col 2 — Live activity stream */}
        <section className="xl:col-span-5 surface rounded-xl overflow-hidden flex flex-col min-h-[420px]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-medium">Activity</h2>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              {agent.status === 'running' && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
              {logs.length} events
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-3">
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
              {[...logs].reverse().map((log, i) => (
                <div
                  key={log.id}
                  className={cn(
                    'border-l-2 pl-3 transition-opacity',
                    i === 0 && agent.status === 'running'
                      ? 'border-blue-500 opacity-100'
                      : 'border-border opacity-90'
                  )}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="uppercase tracking-wide">{log.type}</span>
                    <span>{formatRelativeTime(log.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                    {log.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>

        {/* Col 3 — Escalation + Report */}
        <section className="xl:col-span-4 space-y-4">
          {pending ? (
            <Link
              href={`/escalations/${pending.id}`}
              className="block rounded-xl border border-urgent/40 bg-urgent/5 urgent-ring p-5"
            >
              <p className="text-xs font-medium text-urgent uppercase tracking-wide">
                Escalation
              </p>
              <p className="text-sm mt-2 leading-snug font-medium">{pending.summary}</p>
              <p className="text-xs text-urgent mt-4 font-medium">Decide now →</p>
            </Link>
          ) : (
            <div className="surface rounded-xl p-5">
              <h2 className="font-medium">Escalation</h2>
              <p className="text-sm text-muted-foreground mt-2">
                No pending decisions. The agent is not waiting on you.
              </p>
            </div>
          )}

          <div className="surface rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium">Report</h2>
              {report && (
                <Link
                  href={`/results/${report.id}`}
                  className="text-xs font-medium text-success hover:underline"
                >
                  Open full →
                </Link>
              )}
            </div>
            {report ? (
              <>
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-success" />
                  {report.title}
                </p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-64 overflow-auto rounded-lg bg-muted/50 p-3">
                  {report.content_markdown.slice(0, 900)}
                  {report.content_markdown.length > 900 ? '…' : ''}
                </pre>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No report yet. It appears when this agent completes a pass.
              </p>
            )}
          </div>

          <div className="surface rounded-xl p-5">
            <h2 className="font-medium mb-2">Config</h2>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-auto">
              {JSON.stringify(
                {
                  theme: agent.config.theme,
                  goal: agent.config.goal,
                  escalation_conditions: agent.config.escalation_conditions,
                },
                null,
                2
              )}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
