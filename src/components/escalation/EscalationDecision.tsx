'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Check, PencilLine, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Agent, AgentLog, Escalation } from '@/lib/supabase/types';
import { AgentStatusBadge } from '@/components/agents/AgentStatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn, formatRelativeTime } from '@/lib/utils';
import { DecisionCoach } from '@/components/demo/DecisionCoach';
import { Suspense } from 'react';
import { useLocale, useT } from '@/i18n/locale-context';
import { formatActivityContent, formatLogType } from '@/i18n/format-activity';
import {
  formatEscalationOptions,
  formatEscalationStatus,
  formatEscalationSummary,
} from '@/i18n/format-content';
import { escalateMatchesLocale } from '@/lib/runtime/locale-text';
import {
  agentLabel,
  displayNameJaFromConfig,
  roleLabel,
} from '@/lib/templates/ja-overlays';
import { readAgentLabelsJa } from '@/i18n/agent-labels-client';

const TIP_KEY = 'conductor-tip-escalation-dismissed';

export function EscalationDecision({
  escalation,
  agent,
  logs,
}: {
  escalation: Escalation;
  agent: Agent;
  logs: AgentLog[];
}) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const [selectedOption, setSelectedOption] = useState<string | null>(
    escalation.options[0] ?? null
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'revise' | 'cancel' | null>(
    null
  );
  const [resuming, setResuming] = useState(false);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [customMap, setCustomMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setCustomMap(readAgentLabelsJa());
  }, []);

  const displayName = agentLabel(agent.name, locale, {
    displayNameJa: displayNameJaFromConfig(agent.config),
    customMap,
  });

  const displaySummary = formatEscalationSummary(
    escalation.summary,
    escalation.context,
    t
  );
  const displayOptions = formatEscalationOptions(
    escalation.options,
    escalation.context,
    t
  );

  const responseText = useMemo(() => {
    const idx = selectedOption ? escalation.options.indexOf(selectedOption) : -1;
    const label =
      idx >= 0 ? (displayOptions[idx] ?? selectedOption) : selectedOption;
    const isToolAllow =
      !!selectedOption && /^Allow .+ for this (?:mission|run)$/i.test(selectedOption);
    const optionPart = isToolAllow ? selectedOption : label;
    if (optionPart && notes.trim()) {
      return `${optionPart}\n\n${t('needsYou.additionalGuidance')}: ${notes.trim()}`;
    }
    if (optionPart) return optionPart;
    return notes.trim();
  }, [selectedOption, notes, t, escalation.options, displayOptions]);

  async function submit(action: 'approve' | 'revise' | 'cancel') {
    if (!responseText) {
      toast.error(t('needsYou.chooseOrWrite'));
      return;
    }
    setSubmitting(action);
    if (action !== 'cancel') setResuming(true);
    try {
      const res = await fetch(`/api/escalations/${escalation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          human_response: responseText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('common.submitFailed'));
      }
      toast.success(t('needsYou.recorded'), {
        description:
          action === 'cancel'
            ? t('needsYou.stopped')
            : action === 'approve'
              ? t('needsYou.approvedResume')
              : t('needsYou.guidanceResume'),
      });
      const nextId = (data.next_pending_ids as string[] | undefined)?.[0];
      router.push(
        nextId
          ? `/escalations/${nextId}`
          : action === 'cancel'
            ? '/dashboard'
            : `/agents/${agent.id}`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.failed'));
      setResuming(false);
    } finally {
      setSubmitting(null);
    }
  }

  useEffect(() => {
    if (escalation.status !== 'pending') return;

    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (escalation.options[idx]) {
          e.preventDefault();
          setSelectedOption(escalation.options[idx]);
        }
        return;
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        void submit('approve');
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        void submit('revise');
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setConfirmAbort(true);
        return;
      }
      // Enter only when not typing free guidance
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'INPUT' ||
        target?.isContentEditable;
      if (e.key === 'Enter' && !e.shiftKey && !typing) {
        e.preventDefault();
        void submit('approve');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escalation.id, escalation.status, escalation.options, responseText]);

  const isResolved = escalation.status !== 'pending';
  const theme = String(agent.config?.theme ?? '');
  const contextFindings = Array.isArray(escalation.context?.findings)
    ? (escalation.context!.findings as string[])
    : [];
  const languageMismatch =
    escalation.context?.languageMismatch === true ||
    (escalation.context?.source === 'llm' &&
      locale === 'ja' &&
      !escalateMatchesLocale(escalation.summary, escalation.options, locale));

  return (
    <div className="mx-auto max-w-3xl space-y-4 md:space-y-6 pb-28 md:pb-10">
      <header className="sticky top-0 z-20 -mx-4 md:-mx-0 px-4 md:px-0 py-3 bg-background/90 backdrop-blur border-b border-border/60 flex items-center justify-between gap-3">
        <Link
          href="/escalations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 min-h-11"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('needsYou.all')}
        </Link>
        <p className="text-sm font-medium truncate">{t('needsYou.title')}</p>
        {!isResolved ? (
          <span className="shrink-0 text-xs font-semibold text-white bg-urgent rounded-full px-2.5 py-1">
            {t('app.needsPending', { n: 1 })}
          </span>
        ) : (
          <span className="w-16" />
        )}
      </header>

      {!isResolved && (
        <Suspense fallback={null}>
          <DecisionCoach tipKey={TIP_KEY} />
        </Suspense>
      )}

      <div
        className="rounded-xl bg-urgent text-white px-4 md:px-5 py-4 flex items-center gap-3"
        style={{ boxShadow: '0 0 24px var(--urgent-soft)' }}
      >
        <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]">
            {t('needsYou.title')}
          </p>
          <p className="text-sm text-white/90 truncate">
            {displayName} · {roleLabel(agent.role, locale)}
          </p>
        </div>
        <AgentStatusBadge status={agent.status} />
      </div>

      <div className="space-y-3">
        {theme && (
          <p className="text-xs text-muted-foreground truncate">
            {t('needsYou.themeLabel', { theme })}
          </p>
        )}
        <h1 className="font-display text-[1.5rem] md:text-[1.75rem] leading-[1.4] tracking-tight text-balance line-clamp-4">
          {displaySummary}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{t('needsYou.pickDirection')}</p>
        {languageMismatch && !isResolved && (
          <p className="text-xs rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100">
            {t('needsYou.languageMismatch')}
          </p>
        )}
        {!isResolved && (
          <p className="text-xs text-muted-foreground">{t('needsYou.shortcuts')}</p>
        )}
      </div>

      <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
        <AccordionItem value="sources" className="border-b border-border">
          <AccordionTrigger className="hover:no-underline text-sm min-h-12">
            {t('needsYou.sourceFindings')}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {contextFindings.length}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {contextFindings.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('needsYou.noSourceFindings')}
                </p>
              )}
              {contextFindings.map((finding, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-background/60 p-3 text-sm leading-relaxed whitespace-pre-wrap"
                >
                  {finding}
                </div>
              ))}
              {contextFindings.length > 0 && locale === 'ja' && (
                <p className="text-xs text-muted-foreground">{t('search.findingsNote')}</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="context" className="border-none">
          <AccordionTrigger className="hover:no-underline text-sm min-h-12">
            {t('needsYou.contextTimeline')}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {t('needsYou.events', { n: logs.length })}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('needsYou.noLogs')}</p>
              )}
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-border bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="uppercase tracking-wide">
                      {formatLogType(log.type, t)}
                    </span>
                    <span>{formatRelativeTime(log.created_at, locale)}</span>
                  </div>
                  <p className="text-sm mt-1.5 leading-relaxed">
                    {formatActivityContent(log.content, log.metadata, t)}
                  </p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {!isResolved ? (
        <>
          {resuming && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-success" />
              {t('needsYou.resuming')}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">{t('needsYou.chooseDirection')}</h2>
              <p className="text-xs text-muted-foreground">
                {t('needsYou.keysHint', { n: Math.min(9, escalation.options.length) })}
              </p>
            </div>
            <div className="grid gap-2">
              {escalation.options.map((option, index) => {
                const active = selectedOption === option;
                const label = displayOptions[index] ?? option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedOption(option)}
                    className={cn(
                      'text-left rounded-xl px-4 min-h-12 py-3 text-sm transition-all duration-150 flex gap-3 w-full items-center',
                      active
                        ? 'border-0 bg-foreground text-background scale-[1.01]'
                        : 'border border-border bg-card hover:border-foreground/30'
                    )}
                  >
                    <span
                      className={cn(
                        'h-8 w-8 shrink-0 rounded-lg text-sm font-bold flex items-center justify-center',
                        active ? 'bg-background/20' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">{t('needsYou.freeGuidance')}</h2>
            <Textarea
              placeholder={t('needsYou.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[88px]"
            />
          </div>

          <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur pb-safe md:static md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:pb-0">
            <div className="mx-auto max-w-3xl grid gap-2 grid-cols-3 p-3 md:p-0">
              <Button
                variant="success"
                className="min-h-12 h-12"
                disabled={!!submitting}
                onClick={() => submit('approve')}
              >
                {submitting === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span className="flex flex-col items-start leading-none gap-0.5">
                  <span>{t('needsYou.approve')}</span>
                  <kbd className="text-[10px] opacity-70 font-normal">A</kbd>
                </span>
              </Button>
              <Button
                variant="outline"
                className="min-h-12 h-12"
                disabled={!!submitting}
                onClick={() => submit('revise')}
              >
                {submitting === 'revise' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PencilLine className="h-4 w-4" />
                )}
                <span className="flex flex-col items-start leading-none gap-0.5">
                  <span>{t('needsYou.revise')}</span>
                  <kbd className="text-[10px] opacity-70 font-normal">R</kbd>
                </span>
              </Button>
              <Button
                variant="destructive"
                className="min-h-12 h-12"
                disabled={!!submitting}
                onClick={() => setConfirmAbort(true)}
              >
                <X className="h-4 w-4" />
                <span className="flex flex-col items-start leading-none gap-0.5">
                  <span>{t('needsYou.abort')}</span>
                  <kbd className="text-[10px] opacity-70 font-normal">Esc</kbd>
                </span>
              </Button>
            </div>
            {confirmAbort && (
              <div
                className="mx-auto max-w-3xl rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3 m-3 md:m-0 md:mt-3"
                role="alertdialog"
                aria-labelledby="abort-title"
              >
                <p id="abort-title" className="text-sm font-medium">
                  {t('needsYou.stopTitle')}
                </p>
                <p className="text-sm text-muted-foreground">{t('needsYou.stopBody')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    className="min-h-11"
                    disabled={!!submitting}
                    onClick={() => {
                      setConfirmAbort(false);
                      void submit('cancel');
                    }}
                  >
                    {submitting === 'cancel' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('needsYou.yesStop')
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setConfirmAbort(false)}
                  >
                    {t('needsYou.keep')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium">
            {formatEscalationStatus(escalation.status, t)}
          </p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
            {escalation.human_response}
          </p>
          <Button asChild className="mt-4 min-h-11" variant="outline">
            <Link href="/dashboard">{t('needsYou.backDash')}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
