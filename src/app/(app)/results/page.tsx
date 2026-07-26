'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2 } from 'lucide-react';
import type { Artifact } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';

export default function ResultsIndexPage() {
  const [items, setItems] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/demo/artifacts');
      if (res.ok) setItems(await res.json());
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Results</h1>
        <p className="text-muted-foreground mt-2">
          Deliverables from completed agents — the reason you command them.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No reports yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Launch a crew and resolve escalations — reports appear on completion.
          </p>
          <Link href="/templates" className="text-sm font-medium mt-4 inline-block underline">
            Launch a template
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/results/${item.id}`} className="block">
              <Card className="hover:bg-card transition-colors bg-card/80">
                <CardContent className="p-5 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-success mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(item.created_at)} · {item.kind}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
