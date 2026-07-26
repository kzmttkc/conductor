'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { isDemoMode } from '@/lib/config';
import type { Escalation } from '@/lib/supabase/types';

function notifyNew(item: Escalation) {
  toast.message('Agent needs you', {
    description: item.summary.slice(0, 120),
    action: {
      label: 'Decide',
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
    knownIds.current = new Set(data.map((e) => e.id));
    setEscalations(data);
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
            setEscalations((prev) => [
              msg.payload,
              ...prev.filter((e) => e.id !== msg.payload.id),
            ]);
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
              return prev.map((e) => (e.id === msg.payload.id ? msg.payload : e));
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
