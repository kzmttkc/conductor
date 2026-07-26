export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true;
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return true;
  return false;
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
