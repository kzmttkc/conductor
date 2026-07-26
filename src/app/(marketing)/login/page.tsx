'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Github, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isDemoMode } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/i18n/locale-context';

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const demo = isDemoMode();

  async function enterDemo() {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/login', { method: 'POST' });
      if (!res.ok) throw new Error('Demo login failed');
      toast.success('Welcome to Conductor');
      router.push('/onboarding');
      router.refresh();
    } catch {
      toast.error('Could not start demo session');
    } finally {
      setLoading(false);
    }
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success('Magic link sent — check your inbox');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  async function github() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'GitHub sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 bg-[#f4f6f3] text-[#141414] py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#e4e4e0] bg-white/90 p-6 md:p-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">
            {demo ? t('login.demoTitle') : t('login.title')}
          </h1>
          <p className="text-sm text-[#6b6b66] mt-2">
            {demo ? t('login.demoBody') : t('login.prodBody')}
          </p>

          {demo ? (
            <>
              <Button
                className="w-full min-h-12 mt-6"
                onClick={enterDemo}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? t('login.enteringDemo') : t('login.enterDemo')}
              </Button>
            </>
          ) : (
            <>
              <form onSubmit={magicLink} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="min-h-12"
                  />
                </div>
                <Button type="submit" className="w-full min-h-12" disabled={loading}>
                  <Mail className="h-4 w-4" />
                  {t('login.magic')}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-[#6b6b66]">
                <div className="h-px flex-1 bg-[#e4e4e0]" />
                or
                <div className="h-px flex-1 bg-[#e4e4e0]" />
              </div>

              <Button
                variant="outline"
                className="w-full min-h-12"
                onClick={github}
                disabled={loading}
                type="button"
              >
                <Github className="h-4 w-4" />
                {t('login.github')}
              </Button>
            </>
          )}

          <p className="mt-6 text-xs text-[#6b6b66]">
            {t('login.agree')}{' '}
            <Link href="/terms" className="underline underline-offset-2">
              {t('login.terms')}
            </Link>{' '}
            {t('login.and')}{' '}
            <Link href="/privacy" className="underline underline-offset-2">
              {t('login.privacy')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
