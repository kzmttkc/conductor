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
  const [hintVisible, setHintVisible] = useState(false);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [customMap, setCustomMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setCustomMap(readAgentLabelsJa());
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem('conductor-esc-hint-seen')) {
        setHintVisible(true);
      }
    } catch {
      // ignore
    }
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
    // Keep canonical EN option when it is a tool-allow chip so resume matchers still work;
    // otherwise prefer the localized label for activity / guidance.
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
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'INPUT' ||
        target?.isContentEditable;
      if (typing) return;

      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (escalation.options[idx]) {
          setSelectedOption(escalation.options[idx]);
        }
      }
      if ((e.key === 'Enter' || e.key === 'a' || e.key === 'A') && !e.metaKey && !e.ctrlKey) {
        if (e.key === 'a' || e.key === 'A' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          void submit('approve');
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        void submit('revise');
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setConfirmAbort(true);
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

  function dismissHint() {
    setHintVisible(false);
    try {
      localStorage.setItem('conductor-esc-hint-seen', '1');
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 md:space-y-8 pb-28 md:pb-10">
      <Suspense fallback={null}>
        <DecisionCoach />
      </Suspense>
      <div className="rounded-xl bg-urgent text-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]">
            {t('needsYou.title')}
          </p>
          <p className="text-sm text-white/85 truncate">
            {displayName} · {roleLabel(agent.role, locale)}
          </p>
        </div>
        <AgentStatusBadge status={agent.status} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/escalations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('needsYou.all')}
        </Link>
        <Link
          href={`/agents/${agent.id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          {t('needsYou.openAgent', { name: displayName })}
        </Link>
      </div>

      <div className="space-y-3">
        {theme && (
          <p className="text-xs text-muted-foreground truncate">
            {t('needsYou.themeLabel', { theme })}
          </p>
        )}
        <h1 className="font-display text-3xl md:text-[2.6rem] leading-[1.12] tracking-tight text-balance">
          {displaySummary}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{t('needsYou.pickDirection')}</p>
        {languageMismatch && !isResolved && (
          <p className="text-xs rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100">
            {t('needsYou.languageMismatch')}
          </p>
        )}
        {!isResolved && (
          <p className="text-xs text-muted-foreground">{t('needsYou.shortcuts')}</p>
        )}
      </div>

      {hintVisible && !isResolved && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 flex items-start justify-between gap-3 text-xs text-muted-foreground">
          <p>{t('needsYou.hintShortcuts')}</p>
          <button type="button" onClick={dismissHint} className="underline shrink-0">
            {t('needsYou.gotIt')}
          </button>
        </div>
      )}

      <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
        <AccordionItem value="sources" className="border-b border-border">
          <AccordionTrigger className="hover:no-underline text-sm">
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
                  className="rounded-lg border border-border bg-background/60 p-3 text-sm leading-relaxed whitespace-pre-wrap"
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
          <AccordionTrigger className="hover:no-underline text-sm">
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
                  className="rounded-lg border border-border bg-background/60 p-3"
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
                      'text-left rounded-xl border px-4 py-4 text-sm transition-all duration-150 flex gap-3 w-full',
                      active
                        ? 'border-foreground bg-foreground text-background shadow-md scale-[1.01]'
                        : 'border-border bg-card hover:border-foreground/30'
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
                    <span className="pt-1.5 leading-relaxed">{label}</span>
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
              className="min-h-[110px]"
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
                className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3"
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
                  <Button variant="outline" onClick={() => setConfirmAbort(false)}>
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
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard">{t('needsYou.backDash')}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
