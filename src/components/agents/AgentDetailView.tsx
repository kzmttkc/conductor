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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useLocale, useT } from '@/i18n/locale-context';
import {
  formatActivityContent,
  formatCurrentTask,
  formatLogType,
} from '@/i18n/format-activity';
import {
  formatArtifactTitle,
  formatEscalationCondition,
  formatEscalationSummary,
  localizeReportMarkdown,
} from '@/i18n/format-content';
import {
  agentLabel,
  displayNameJaFromConfig,
  roleLabel,
} from '@/lib/templates/ja-overlays';
import { readAgentLabelsJa } from '@/i18n/agent-labels-client';

export function AgentDetailView({ agentId }: { agentId: string }) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [customMap, setCustomMap] = useState<Record<string, string>>({});
  const [displayNameJa, setDisplayNameJa] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setCustomMap(readAgentLabelsJa());
  }, []);

  useEffect(() => {
    if (!agent) return;
    setDisplayNameJa(displayNameJaFromConfig(agent.config) ?? '');
  }, [agent?.id, agent?.config?.display_name_ja]);

  const permOptions: { value: PermissionLevel; label: string }[] = [
    { value: 'allow', label: t('agent.allow') },
    { value: 'require_approval', label: t('agent.askMe') },
    { value: 'deny', label: t('agent.deny') },
  ];

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
    const timer = setInterval(() => void load(), 1500);
    return () => clearInterval(timer);
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
      toast.error(err.error || t('agent.controlFailed'));
      return;
    }
    setAgent(await res.json());
    toast.success(
      action === 'start'
        ? t('agent.started')
        : action === 'stop'
          ? t('agent.stopped')
          : t('agent.retrying')
    );
    void load();
  }

  async function saveDisplayNameJa() {
    if (!agent) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { display_name_ja: displayNameJa.trim() || null },
        }),
      });
      if (!res.ok) {
        toast.error(t('agent.displayNameJaFailed'));
        return;
      }
      setAgent(await res.json());
      toast.success(t('agent.displayNameJaSaved'));
    } finally {
      setSavingName(false);
    }
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
      toast.error(t('agent.permFailed'));
      return;
    }
    setAgent(await res.json());
    const levelLabel =
      level === 'require_approval'
        ? t('agent.askMe')
        : level === 'allow'
          ? t('agent.allow')
          : t('agent.deny');
    toast.success(
      t('agent.permUpdated', { tool: t(`tool.${tool}`), level: levelLabel })
    );
  }

  async function remove() {
    if (!confirm(t('agent.deleteConfirm'))) return;
    const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(t('agent.deleteFailed'));
      return;
    }
    toast.success(t('agent.deleted'));
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className="flex items-center text-muted-foreground py-20">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {t('agent.loading')}
      </div>
    );
  }

  if (!agent) {
    return <p className="text-muted-foreground">{t('agent.notFound')}</p>;
  }

  const pending = escalations.find((e) => e.status === 'pending');
  const report = artifacts[0];
  const shownName = agentLabel(agent.name, locale, {
    displayNameJa: displayNameJaFromConfig(agent.config),
    customMap,
  });
  const hasJaOverlay =
    Boolean(displayNameJaFromConfig(agent.config)) ||
    Boolean(customMap[agent.name]) ||
    shownName !== agent.name;

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('nav.dashboard')}
      </Link>

      <div className="grid gap-4 xl:grid-cols-12 xl:min-h-[72vh]">
        <section className="xl:col-span-3 surface rounded-xl p-5 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="font-display text-3xl tracking-tight leading-none">
                {shownName}
              </h1>
              <AgentStatusBadge status={agent.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {roleLabel(agent.role, locale)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t('agent.runtimeName', { name: agent.name })}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Boolean(agent.config.prefer_ja_sources) && (
                <span className="inline-flex text-[11px] font-medium rounded-md border border-border bg-muted/50 px-2 py-1">
                  {t('agent.preferJaOn')}
                </span>
              )}
              {Boolean(agent.config.prefer_structured_ja) && (
                <span className="inline-flex text-[11px] font-medium rounded-md border border-border bg-muted/50 px-2 py-1">
                  {t('agent.preferStructuredOn')}
                </span>
              )}
            </div>
            {locale === 'ja' && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="display-name-ja" className="text-xs">
                  {t('agent.displayNameJa')}
                </Label>
                <Input
                  id="display-name-ja"
                  value={displayNameJa}
                  onChange={(e) => setDisplayNameJa(e.target.value)}
                  placeholder={t('agentsNew.displayNameJaPh')}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('agent.displayNameJaHint', { name: agent.name })}
                </p>
                {!hasJaOverlay && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-200">
                    {t('agent.unmappedNameHint')}
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={savingName}
                  onClick={() => void saveDisplayNameJa()}
                >
                  {savingName ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    t('agent.displayNameJaSave')
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t('agent.currentTask')}
            </p>
            <p className="text-sm mt-1.5 leading-relaxed">
              {formatCurrentTask(agent.current_task, t)}
            </p>
          </div>

          <div>
            <h2 className="font-medium mb-1">{t('agent.permissions')}</h2>
            <p className="text-xs text-muted-foreground mb-3">{t('agent.permissionsHint')}</p>
            <div className="space-y-4">
              {TOOL_NAMES.map((tool) => {
                const value = (agent.permissions?.[tool] as PermissionLevel) || 'deny';
                return (
                  <div key={tool} className="space-y-1.5">
                    <Label className="text-xs">
                      {t(`tool.${tool}`)}
                    </Label>
                    <div className="grid grid-cols-3 gap-1">
                      {permOptions.map((opt) => (
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
              {t('agent.start')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => control('stop')}>
              <Square className="h-4 w-4" />
              {t('agent.stop')}
            </Button>
            {agent.status === 'error' && (
              <>
                <Button variant="success" size="sm" onClick={() => control('recover')}>
                  <RotateCcw className="h-4 w-4" />
                  {t('agent.retry')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => control('recover', { allow_web_search: true })}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('agent.retryAllowSearch')}
                </Button>
              </>
            )}
            <Button variant="destructive" size="sm" onClick={remove}>
              <Trash2 className="h-4 w-4" />
              {t('agent.delete')}
            </Button>
          </div>

          {Boolean(agent.config.pipeline) && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('agent.pipelineStep', {
                n: (Number(agent.config.pipeline_index) || 0) + 1,
              })}
              {agent.config.pipeline_next
                ? t('agent.pipelineNext')
                : t('agent.pipelineFinal')}
            </p>
          )}
        </section>

        <section className="xl:col-span-5 surface rounded-xl overflow-hidden flex flex-col min-h-[420px]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-medium">{t('agent.activity')}</h2>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              {agent.status === 'running' && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
              {t('needsYou.events', { n: logs.length })}
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-3">
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('agent.noActivity')}</p>
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
                    <span className="uppercase tracking-wide">
                      {formatLogType(log.type, t)}
                    </span>
                    <span>{formatRelativeTime(log.created_at, locale)}</span>
                  </div>
                  <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                    {formatActivityContent(log.content, log.metadata, t)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>

        <section className="xl:col-span-4 space-y-4">
          {pending ? (
            <Link
              href={`/escalations/${pending.id}`}
              className="block rounded-xl border border-urgent/40 bg-urgent/5 urgent-ring p-5"
            >
              <p className="text-xs font-medium text-urgent uppercase tracking-wide">
                {t('needsYou.title')}
              </p>
              <p className="text-sm mt-2 leading-snug font-medium">
                {formatEscalationSummary(pending.summary, pending.context, t)}
              </p>
              <p className="text-xs text-urgent mt-4 font-medium">{t('agent.decideNow')}</p>
            </Link>
          ) : (
            <div className="surface rounded-xl p-5">
              <h2 className="font-medium">{t('needsYou.title')}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t('agent.noPending')}</p>
            </div>
          )}

          <div className="surface rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium">{t('agent.report')}</h2>
              {report && (
                <Link
                  href={`/results/${report.id}`}
                  className="text-xs font-medium text-success hover:underline"
                >
                  {t('agent.openFull')}
                </Link>
              )}
            </div>
            {report ? (
              <>
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-success" />
                  {formatArtifactTitle(report.title, t, { customMap })}
                </p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-64 overflow-auto rounded-lg bg-muted/50 p-3">
                  {localizeReportMarkdown(report.content_markdown, t).slice(0, 900)}
                  {report.content_markdown.length > 900 ? '…' : ''}
                </pre>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('agent.noReport')}</p>
            )}
          </div>

          <div className="surface rounded-xl p-5 space-y-3">
            <h2 className="font-medium">{t('agent.runDetails')}</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t('agent.theme')}</dt>
                <dd>{String(agent.config.theme || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('agent.goal')}</dt>
                <dd className="leading-relaxed">{String(agent.config.goal || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('agent.asksAbout')}</dt>
                <dd>
                  {Array.isArray(agent.config.escalation_conditions) &&
                  agent.config.escalation_conditions.length
                    ? (agent.config.escalation_conditions as string[])
                        .map((c) => formatEscalationCondition(c, t))
                        .join(locale === 'ja' ? '、' : ', ')
                    : t('agent.judgmentDefault')}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
