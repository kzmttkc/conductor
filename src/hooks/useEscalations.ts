'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { isDemoMode } from '@/lib/config';
import type { Escalation } from '@/lib/supabase/types';

export function useEscalations(userId: string | null) {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIds = useRef<Set<string>>(new Set());
  const booted = useRef(false);

  const fetchAll = useCallback(async () => {
    if (isDemoMode()) {
      const res = await fetch('/api/demo/escalations?status=pending');
      if (!res.ok) return;
      const data = (await res.json()) as Escalation[];
      setEscalations(data);
      knownIds.current = new Set(data.map((e) => e.id));
      return;
    }
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

    if (!isDemoMode()) return;

    const es = new EventSource('/api/demo/events');
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
          if (booted.current && isNew) {
            toast.message('Agent needs you', {
              description: msg.payload.summary.slice(0, 120),
              action: {
                label: 'Decide',
                onClick: () => {
                  window.location.href = `/escalations/${msg.payload.id}`;
                },
              },
            });
          }
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

    const poll = setInterval(() => void fetchAll(), 8000);
    return () => {
      es.close();
      clearInterval(poll);
    };
  }, [userId, fetchAll]);

  return { escalations, loading, refresh: fetchAll };
}
