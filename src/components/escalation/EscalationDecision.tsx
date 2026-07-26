'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, PencilLine, X, Loader2 } from 'lucide-react';
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
    try {
      const res = await fetch(`/api/demo/escalations/${escalation.id}`, {
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
      toast.success(
        action === 'cancel'
          ? 'Agent stopped'
          : action === 'approve'
            ? 'Approved — agent resuming'
            : 'Guidance sent — agent resuming'
      );
      const nextId = (data.next_pending_ids as string[] | undefined)?.[0];
      router.push(nextId ? `/escalations/${nextId}` : '/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
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
      if ((e.key === 'Enter' || e.key === 'a') && !e.metaKey && !e.ctrlKey) {
        if (e.key === 'a' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          void submit('approve');
        }
      }
      if (e.key === 'r') {
        e.preventDefault();
        void submit('revise');
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        void submit('cancel');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escalation.id, escalation.status, escalation.options, responseText]);

  const isResolved = escalation.status !== 'pending';
  const theme = String(agent.config?.theme ?? '');

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/escalations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All escalations
        </Link>
        <Link
          href={`/agents/${agent.id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Open {agent.name} →
        </Link>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-urgent/10 text-urgent px-3 py-1 text-xs font-medium">
          Decision required
          <span className="opacity-70">· 3s rule</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{agent.name}</span>
          <span>·</span>
          <span>{agent.role}</span>
          <AgentStatusBadge status={agent.status} />
          {theme && (
            <>
              <span>·</span>
              <span className="truncate max-w-[240px]">{theme}</span>
            </>
          )}
        </div>
        <h1 className="font-display text-3xl md:text-[2.75rem] leading-[1.1] tracking-tight text-balance">
          {escalation.summary}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pick a direction. The agent waits until you decide — nothing continues
          without you.
        </p>
        <p className="text-xs text-muted-foreground">
          Shortcuts: <kbd className="px-1 border border-border rounded">1–9</kbd> options ·{' '}
          <kbd className="px-1 border border-border rounded">A</kbd> approve ·{' '}
          <kbd className="px-1 border border-border rounded">R</kbd> revise ·{' '}
          <kbd className="px-1 border border-border rounded">Esc</kbd> abort
        </p>
      </div>

      <Accordion type="single" collapsible className="surface rounded-xl px-4">
        <AccordionItem value="context" className="border-none">
          <AccordionTrigger className="hover:no-underline">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Choose a direction</h2>
              <p className="text-xs text-muted-foreground">Keys 1–{escalation.options.length}</p>
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
                      'text-left rounded-xl border px-4 py-3.5 text-sm transition-all flex gap-3',
                      active
                        ? 'border-foreground bg-foreground text-background shadow-sm'
                        : 'border-border bg-card hover:border-foreground/30'
                    )}
                  >
                    <span
                      className={cn(
                        'h-6 w-6 shrink-0 rounded-md text-xs font-semibold flex items-center justify-center',
                        active ? 'bg-background/15' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{option}</span>
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

          <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/90 backdrop-blur md:static md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0">
            <div className="mx-auto max-w-3xl grid gap-2 sm:grid-cols-3 p-3 md:p-0">
              <Button
                variant="success"
                className="h-11"
                disabled={!!submitting}
                onClick={() => submit('approve')}
              >
                {submitting === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve
                <kbd className="ml-1 hidden sm:inline text-[10px] opacity-70">A</kbd>
              </Button>
              <Button
                variant="outline"
                className="h-11"
                disabled={!!submitting}
                onClick={() => submit('revise')}
              >
                {submitting === 'revise' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PencilLine className="h-4 w-4" />
                )}
                Revise
                <kbd className="ml-1 hidden sm:inline text-[10px] opacity-70">R</kbd>
              </Button>
              <Button
                variant="destructive"
                className="h-11"
                disabled={!!submitting}
                onClick={() => submit('cancel')}
              >
                {submitting === 'cancel' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Abort
                <kbd className="ml-1 hidden sm:inline text-[10px] opacity-70">Esc</kbd>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium capitalize">{escalation.status}</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
            {escalation.human_response}
          </p>
        </div>
      )}
    </div>
  );
}
