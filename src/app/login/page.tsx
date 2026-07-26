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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function enterDemo() {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/login', { method: 'POST' });
      if (!res.ok) throw new Error('Demo login failed');
      toast.success('Welcome, Commander');
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
    if (isDemoMode()) {
      await enterDemo();
      return;
    }
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
    if (isDemoMode()) {
      await enterDemo();
      return;
    }
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-3xl tracking-tight block mb-8">
          Conductor
        </Link>
        <div className="surface rounded-2xl p-6 md:p-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Magic Link or GitHub. Demo mode works without Supabase.
          </p>

          <form onSubmit={magicLink} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isDemoMode()}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Mail className="h-4 w-4" />
              {isDemoMode() ? 'Continue with Demo' : 'Send magic link'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={github}
            disabled={loading}
            type="button"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>

          {isDemoMode() && (
            <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
              Demo Mode is on. You&apos;ll get a local command tower with Research
              Crew, realtime status, and full escalation flow — no cloud setup
              required.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
