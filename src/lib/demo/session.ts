import { randomUUID } from 'crypto';

export const DEMO_SESSION_COOKIE = 'conductor_demo_session';

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function createVisitorId() {
  return randomUUID();
}

export function visitorFromSession(session: string | undefined | null) {
  if (!session) return null;
  // Legacy cookie value "1" → stable local commander
  if (session === '1') {
    return {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'commander@conductor.local',
      name: 'You',
    };
  }
  if (!isUuid(session)) return null;
  return {
    id: session,
    email: `commander-${session.slice(0, 8)}@conductor.demo`,
    name: 'You',
  };
}
