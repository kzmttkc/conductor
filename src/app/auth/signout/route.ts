import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDemoMode } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/config';

export async function POST() {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    cookieStore.delete('conductor_demo_session');
    return NextResponse.redirect(new URL('/login', APP_URL), { status: 303 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', APP_URL), { status: 303 });
}
