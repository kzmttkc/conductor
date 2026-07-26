'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Escalation } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';

export default function EscalationsPage() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/escalations');
        if (!res.ok) {
          if (!cancelled) {
            setError('Couldn’t load decisions. Check your connection and retry.');
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as Escalation[];
        if (!cancelled) {
          setItems(data);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Couldn’t load decisions. Check your connection and retry.');
          setLoading(false);
        }
      }
    };
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const pending = items.filter((e) => e.status === 'pending');
  const resolved = items.filter((e) => e.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Needs You</h1>
        <p className="text-muted-foreground mt-2">
          When an agent needs your judgment, decide here — then it resumes.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center text-muted-foreground py-16" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading decisions…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border px-6 py-10 text-center space-y-4">
          <p className="font-medium">{error}</p>
          <Button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void fetch('/api/escalations')
                .then(async (res) => {
                  if (!res.ok) throw new Error('fail');
                  setItems(await res.json());
                  setLoading(false);
                })
                .catch(() => {
                  setError('Couldn’t load decisions. Check your connection and retry.');
                  setLoading(false);
                });
            }}
          >
            Retry
          </Button>
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No pending decisions</p>
          <p className="text-sm text-muted-foreground mt-1">
            Launch a crew — when judgment is needed, it appears here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/templates">Launch a crew</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-urgent">Needs you now</h2>
          {pending.map((item) => (
            <Link key={item.id} href={`/escalations/${item.id}`} className="block">
              <Card className="urgent-ring border-urgent/40 hover:bg-urgent/5 transition-colors">
                <CardContent className="p-5">
                  <p className="font-medium leading-snug">{item.summary}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatRelativeTime(item.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Resolved</h2>
          {resolved.map((item) => (
            <Link key={item.id} href={`/escalations/${item.id}`} className="block">
              <Card className="bg-card/60 hover:bg-card transition-colors">
                <CardContent className="p-4">
                  <p className="text-sm">{item.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {item.status} · {formatRelativeTime(item.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
