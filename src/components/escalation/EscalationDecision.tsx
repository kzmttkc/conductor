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

  useEffect(() => {
    try {
      if (!localStorage.getItem('conductor-esc-hint-seen')) {
        setHintVisible(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const responseText = useMemo(() => {
    if (selectedOption && notes.trim()) {
      return `${selectedOption}\n\nAdditional guidance: ${notes.trim()}`;
    }
    if (selectedOption) return selectedOption;
    return notes.trim();
  }, [selectedOption, notes]);

  async function submit(action: 'approve' | 'revise' | 'cancel') {
    if (!responseText) {
      toast.error('Choose an option or write your guidance');
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
        throw new Error(data.error || 'Failed to submit');
      }
      toast.success('Decision recorded', {
        description:
          action === 'cancel'
            ? 'Agent stopped'
            : action === 'approve'
              ? 'Approved — agent resuming'
              : 'Guidance sent — agent resuming',
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
      toast.error(err instanceof Error ? err.message : 'Failed');
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
        // Esc asks for confirm — do not instantly abort the agent
        setConfirmAbort(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escalation.id, escalation.status, escalation.options, responseText]);

  const isResolved = escalation.status !== 'pending';
  const theme = String(agent.config?.theme ?? '');

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
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Needs You</p>
          <p className="text-sm text-white/85 truncate">
            {agent.name} · {agent.role}
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
          All Needs You
        </Link>
        <Link
          href={`/agents/${agent.id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          Open {agent.name} →
        </Link>
      </div>

      <div className="space-y-3">
        {theme && (
          <p className="text-xs text-muted-foreground truncate">Theme · {theme}</p>
        )}
        <h1 className="font-display text-3xl md:text-[2.6rem] leading-[1.12] tracking-tight text-balance">
          {escalation.summary}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pick a direction. The agent waits until you decide.
        </p>
        {!isResolved && (
          <p className="text-xs text-muted-foreground">
            Shortcuts: 1–9 select · A approve · R revise · Esc asks before abort
          </p>
        )}
      </div>

      {hintVisible && !isResolved && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 flex items-start justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Same shortcuts work from anywhere on this page — no need to click into a field first.
          </p>
          <button type="button" onClick={dismissHint} className="underline shrink-0">
            Got it
          </button>
        </div>
      )}

      <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
        <AccordionItem value="context" className="border-none">
          <AccordionTrigger className="hover:no-underline text-sm">
            Context & timeline
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {logs.length} events
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground">No logs yet.</p>
              )}
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-border bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="uppercase tracking-wide">{log.type}</span>
                    <span>{formatRelativeTime(log.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1.5 leading-relaxed">{log.content}</p>
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
              Resuming agent…
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Choose a direction</h2>
              <p className="text-xs text-muted-foreground">
                Keys 1–{Math.min(9, escalation.options.length)}
              </p>
            </div>
            <div className="grid gap-2">
              {escalation.options.map((option, index) => {
                const active = selectedOption === option;
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
                    <span className="pt-1.5 leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Or write free guidance</h2>
            <Textarea
              placeholder="Optional notes, constraints, or a full override…"
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
                  <span>Approve</span>
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
                  <span>Revise</span>
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
                  <span>Abort</span>
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
                  Stop this agent?
                </p>
                <p className="text-sm text-muted-foreground">
                  It will not resume until you launch or recover it again.
                </p>
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
                      'Yes, stop agent'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmAbort(false)}>
                    Keep deciding
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium capitalize">{escalation.status}</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
            {escalation.human_response}
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
