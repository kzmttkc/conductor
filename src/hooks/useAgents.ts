'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/config';
import type { Agent } from '@/lib/supabase/types';

export function useAgents(userId: string | null) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDemo = useCallback(async () => {
    const res = await fetch('/api/agents');
    if (!res.ok) throw new Error('Failed to fetch agents');
    const data = (await res.json()) as Agent[];
    setAgents(data);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    if (isDemoMode()) {
      const boot = async () => {
        try {
          await fetchDemo();
        } catch (e) {
          console.error(e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      void boot();

      // Cookie-backed demo on Vercel: SSE cannot share process memory — poll instead.
      const pollMs = process.env.NEXT_PUBLIC_VERCEL_ENV ? 2000 : 8000;
      const es =
        process.env.NEXT_PUBLIC_VERCEL_ENV ? null : new EventSource('/api/events');
      if (es) {
        es.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as {
              type: string;
              event: string;
              payload: Agent | { id: string };
            };
            if (msg.type !== 'agents') return;
            if (msg.event === 'INSERT') {
              setAgents((prev) => [
                msg.payload as Agent,
                ...prev.filter((a) => a.id !== (msg.payload as Agent).id),
              ]);
            }
            if (msg.event === 'UPDATE') {
              setAgents((prev) =>
                prev.map((a) =>
                  a.id === (msg.payload as Agent).id ? (msg.payload as Agent) : a
                )
              );
            }
            if (msg.event === 'DELETE') {
              setAgents((prev) =>
                prev.filter((a) => a.id !== (msg.payload as { id: string }).id)
              );
            }
          } catch {
            // ignore malformed events
          }
        };
      }

      const poll = setInterval(() => {
        void fetchDemo();
      }, pollMs);

      return () => {
        cancelled = true;
        es?.close();
        clearInterval(poll);
      };
    }

    const supabase = createClient();

    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch agents:', error);
      } else if (data && !cancelled) {
        setAgents(data as Agent[]);
      }
      if (!cancelled) setLoading(false);
    };

    void fetchAgents();

    const channel = supabase
      .channel(`agents-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAgents((prev) => [payload.new as Agent, ...prev]);
          }
          if (payload.eventType === 'UPDATE') {
            setAgents((prev) =>
              prev.map((a) =>
                a.id === (payload.new as Agent).id ? (payload.new as Agent) : a
              )
            );
          }
          if (payload.eventType === 'DELETE') {
            setAgents((prev) =>
              prev.filter((a) => a.id !== (payload.old as Agent).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, fetchDemo]);

  return { agents, loading, setAgents, refresh: fetchDemo };
}
