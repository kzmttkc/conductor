'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/locale-context';

const FALLBACK_ORIGIN = 'https://conductor-blond-xi.vercel.app';

export function ShareButtons({
  path = '/demo/moment',
  text,
  tone = 'dark',
}: {
  path?: string;
  text?: string;
  tone?: 'dark' | 'light';
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  const shareText = text ?? t('share.caption');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}${path}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${shareText} ${url}`);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('share.copied'));
    setTimeout(() => setCopied(false), 1500);
  }

  const outline = cn(
    tone === 'dark' && 'border-white/20 bg-transparent text-white hover:bg-white/10',
    tone === 'light' && ''
  );
  const solid =
    tone === 'dark' ? 'bg-white text-black hover:bg-white/90' : undefined;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={outline}
        onClick={copy}
        aria-label={t('share.copyAria')}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {t('share.copyLink')}
      </Button>
      <Button asChild size="sm" className={solid}>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t('share.xAria')}
        >
          <Share2 className="h-4 w-4" />
          {t('share.postX')}
        </a>
      </Button>
      <Button asChild size="sm" variant="outline" className={outline}>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t('share.linkedinAria')}
        >
          {t('share.linkedin')}
        </a>
      </Button>
    </div>
  );
}
