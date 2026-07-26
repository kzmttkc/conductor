import { createBrowserClient } from '@supabase/ssr';
import { isDemoMode } from '@/lib/config';

export function createClient() {
  if (isDemoMode()) {
    // Demo mode does not use a real browser Supabase client.
    // Hooks fall back to API + SSE.
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
