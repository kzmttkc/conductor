'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Escalation } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';

export default function EscalationsPage() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch('/api/demo/escalations');
      if (!res.ok) return;
      const data = (await res.json()) as Escalation[];
      if (!cancelled) {
        setItems(data);
        setLoading(false);
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
        <h1 className="font-display text-4xl tracking-tight">Escalations</h1>
        <p className="text-muted-foreground mt-2">
          The core loop. Low cognitive load. Decide, then let agents resume.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center text-muted-foreground py-16">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading…
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No pending decisions</p>
          <p className="text-sm text-muted-foreground mt-1">
            When an agent needs judgment, it will appear here instantly.
          </p>
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
