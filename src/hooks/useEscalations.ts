'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { isDemoMode } from '@/lib/config';
import type { Escalation } from '@/lib/supabase/types';
import { getMessages, translate } from '@/i18n/get-messages';
import type { Locale } from '@/i18n/types';
import { formatEscalationSummary } from '@/i18n/format-content';
import { dedupePendingEscalations } from '@/lib/escalations/dedupe';

function currentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  return document.documentElement.lang === 'ja' ? 'ja' : 'en';
}

function notifyNew(item: Escalation) {
  const m = getMessages(currentLocale());
  const t = (path: string, vars?: Record<string, string | number>) =>
    translate(m, path, vars);
  const summary = formatEscalationSummary(item.summary, item.context, t);
  toast.message(translate(m, 'needsYou.toastTitle'), {
    description: summary.slice(0, 120),
    action: {
      label: translate(m, 'app.decide'),
      onClick: () => {
        window.location.href = `/escalations/${item.id}`;
      },
    },
  });
}

export function useEscalations(userId: string | null) {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIds = useRef<Set<string>>(new Set());
  const booted = useRef(false);

  const fetchAll = useCallback(async (opts?: { notify?: boolean }) => {
    const res = await fetch('/api/escalations?status=pending');
    if (!res.ok) return;
    const data = (await res.json()) as Escalation[];
    if (opts?.notify && booted.current) {
      for (const item of data) {
        if (!knownIds.current.has(item.id)) notifyNew(item);
      }
    }
    const deduped = dedupePendingEscalations(data);
    knownIds.current = new Set(deduped.map((e) => e.id));
    setEscalations(deduped);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        await fetchAll();
      } finally {
        booted.current = true;
        setLoading(false);
      }
    })();

    const onVercel = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);
    const pollMs = isDemoMode() && onVercel ? 2000 : 5000;
    const es =
      isDemoMode() && !onVercel ? new EventSource('/api/events') : null;

    if (es) {
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type: string;
            event: string;
            payload: Escalation;
          };
          if (msg.type !== 'escalations') return;
          if (msg.event === 'INSERT' && msg.payload.status === 'pending') {
            const isNew = !knownIds.current.has(msg.payload.id);
            knownIds.current.add(msg.payload.id);
            setEscalations((prev) =>
              dedupePendingEscalations([
                msg.payload,
                ...prev.filter((e) => e.id !== msg.payload.id),
              ])
            );
            if (booted.current && isNew) notifyNew(msg.payload);
          }
          if (msg.event === 'UPDATE') {
            if (msg.payload.status !== 'pending') {
              knownIds.current.delete(msg.payload.id);
            }
            setEscalations((prev) => {
              if (msg.payload.status !== 'pending') {
                return prev.filter((e) => e.id !== msg.payload.id);
              }
              return dedupePendingEscalations(
                prev.map((e) => (e.id === msg.payload.id ? msg.payload : e))
              );
            });
          }
        } catch {
          // ignore
        }
      };
    }

    const poll = setInterval(
      () => void fetchAll({ notify: !es }),
      pollMs
    );
    return () => {
      es?.close();
      clearInterval(poll);
    };
  }, [userId, fetchAll]);

  return { escalations, loading, refresh: fetchAll };
}
