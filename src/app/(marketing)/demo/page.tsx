'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Play, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShareButtons } from '@/components/marketing/ShareButtons';

export default function PublicDemoPage() {
  const router = useRouter();
  const [theme, setTheme] = useState('AI agent orchestration market 2026');
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/public-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start demo');
      toast.success('Demo launched — watch for Needs You');
      router.push(data.next || '/dashboard?tour=1&src=public-demo');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
      setLoading(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/demo`;
    await navigator.clipboard.writeText(url);
    toast.success('Demo link copied');
  }

  return (
    <div className="relative overflow-hidden bg-[#f4f6f3] text-[#141414]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f4f6f3_0%,#e7eee8_50%,#dfe8e3_100%)]" />
      <div className="mx-auto max-w-xl px-5 sm:px-6 py-12 sm:py-16 md:py-20">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-tight text-balance">
          Try the command tower
        </h1>
        <p className="text-[#6b6b66] mt-4 leading-relaxed">
          No signup. One click launches Solo Scout, then a real{' '}
          <span className="text-[#d64545] font-medium">Needs You</span> escalation
          appears so you can feel the core loop in under a minute.
        </p>

        <div className="rounded-2xl border border-[#e4e4e0] bg-white/80 p-5 sm:p-6 mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Mission theme</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="min-h-12"
            />
          </div>
          <Button className="w-full min-h-12" size="lg" onClick={start} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start public demo
          </Button>
          <Button
            variant="outline"
            className="w-full min-h-12"
            onClick={copyLink}
            type="button"
          >
            <Share2 className="h-4 w-4" />
            Copy /demo link
          </Button>
        </div>

        <div className="mt-6">
          <ShareButtons
            tone="light"
            path="/demo"
            text="One-click Conductor demo — launch Scout, hit Needs You, decide in 3 seconds:"
          />
        </div>

        <p className="text-xs text-[#6b6b66] mt-6 leading-relaxed">
          Prefer a static share preview of the escalation moment?{' '}
          <Link href="/demo/moment" className="underline underline-offset-2">
            Open Needs You moment
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
