import { cookies } from 'next/headers';
import { isDemoMode } from '@/lib/config';
import { visitorFromSession } from '@/lib/demo/session';
import { createClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const session = cookieStore.get('conductor_demo_session')?.value;
    return visitorFromSession(session);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
  };
}
