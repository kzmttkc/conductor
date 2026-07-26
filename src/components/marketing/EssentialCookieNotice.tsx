'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const KEY = 'conductor-cookie-ok';

/** Minimal essential-cookie notice for marketing surfaces. */
export function EssentialCookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-[60] mx-auto max-w-lg rounded-xl border border-[#e4e4e0] bg-white/95 p-4 shadow-lg text-[#141414]">
      <p className="text-sm leading-relaxed">
        We use essential cookies for sign-in and demo sessions.{' '}
        <Link href="/privacy#cookies" className="underline underline-offset-2">
          Cookie notice
        </Link>
      </p>
      <Button
        className="mt-3 w-full min-h-10"
        size="sm"
        onClick={() => {
          try {
            localStorage.setItem(KEY, '1');
          } catch {
            // ignore
          }
          setVisible(false);
        }}
      >
        Got it
      </Button>
    </div>
  );
}
