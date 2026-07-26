'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Play, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShareButtons } from '@/components/marketing/ShareButtons';
import { useT } from '@/i18n/locale-context';

const DEMO_THEME_KEY = 'conductor-demo-theme';
const DEFAULT_THEME = 'Electric vehicle market trends 2026';

export default function PublicDemoPage() {
  const router = useRouter();
  const t = useT();
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    try {
      return localStorage.getItem(DEMO_THEME_KEY) || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(DEMO_THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  function friendlyDemoError(message: string): string {
    if (
      message.includes('NEXT_PUBLIC') ||
      message.includes('Demo Mode') ||
      message.includes('not available')
    ) {
      return t('demo.unavailable');
    }
    return message;
  }

  async function start() {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/public-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(friendlyDemoError(data.error || 'Could not start demo'));
      }
      toast.success(t('templates.launched'));
      router.push(data.next || '/dashboard?tour=1&src=public-demo');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not start demo. Please try again.'
      );
      setLoading(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/demo`;
    await navigator.clipboard.writeText(url);
    toast.success(t('demo.copyLink'));
  }

  return (
    <div className="relative overflow-hidden bg-[#f4f6f3] text-[#141414]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f4f6f3_0%,#e7eee8_50%,#dfe8e3_100%)]" />
      <div className="mx-auto max-w-xl px-5 sm:px-6 py-12 sm:py-16 md:py-20">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-tight text-balance">
          {t('demo.title')}
        </h1>
        <p className="text-[#6b6b66] mt-4 leading-relaxed">{t('demo.body')}</p>

        <div className="rounded-2xl border border-[#e4e4e0] bg-white/80 p-5 sm:p-6 mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">{t('demo.themeLabel')}</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="min-h-12"
            />
          </div>
          <Button
            className="w-full min-h-12"
            size="lg"
            onClick={start}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('demo.starting')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {t('demo.start')}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full min-h-12"
            onClick={copyLink}
            type="button"
          >
            <Share2 className="h-4 w-4" />
            {t('demo.copyLink')}
          </Button>
        </div>

        <div className="mt-6">
          <ShareButtons tone="light" path="/demo" text={t('share.demoCaption')} />
        </div>

        <p className="text-xs text-[#6b6b66] mt-6 leading-relaxed">
          {t('demo.momentLink')}{' '}
          <Link href="/demo/moment" className="underline underline-offset-2">
            {t('demo.openMoment')}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
