'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_TEXT =
  'When agents need judgment, Conductor makes it a 3-second decision. Try the public demo:';
const FALLBACK_ORIGIN = 'https://conductor-blond-xi.vercel.app';

export function ShareButtons({
  path = '/demo/moment',
  text = DEFAULT_TEXT,
  tone = 'dark',
}: {
  path?: string;
  text?: string;
  tone?: 'dark' | 'light';
}) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}${path}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text} ${url}`);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied');
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
      <Button type="button" variant="outline" size="sm" className={outline} onClick={copy} aria-label="Copy share link">
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        Copy link
      </Button>
      <Button asChild size="sm" className={solid}>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on X"
        >
          <Share2 className="h-4 w-4" />
          Post on X
        </a>
      </Button>
      <Button asChild size="sm" variant="outline" className={outline}>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on LinkedIn"
        >
          LinkedIn
        </a>
      </Button>
    </div>
  );
}
