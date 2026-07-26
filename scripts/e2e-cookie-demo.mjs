/**
 * Simulates two serverless instances via cookie jar round-trip.
 * Usage: DEMO_COOKIE_STORE=true node scripts/e2e-cookie-demo.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://127.0.0.1:3000';

async function main() {
  // Prefer fetch + manual Set-Cookie parsing (no tough-cookie dep)
  const jar = new Map();

  function storeCookies(res) {
    const raw = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [];
    for (const c of raw) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      if (eq < 0) continue;
      jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  }
  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  console.log('POST /api/demo/public-start …');
  const start = await fetch(`${base}/api/demo/public-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
    body: JSON.stringify({ theme: 'AI agent orchestration market 2026' }),
  });
  storeCookies(start);
  const startBody = await start.json();
  console.log('start', start.status, {
    ok: startBody.ok,
    pending: startBody.pendingEscalations,
    next: startBody.next,
    cookies: [...jar.keys()],
    stateLen: (jar.get('conductor_demo_state') || '').length,
  });
  if (!start.ok || !startBody.pendingEscalations) {
    process.exitCode = 1;
    console.error('FAIL: expected pending escalation after public-start');
    return;
  }

  console.log('GET /api/demo/escalations (fresh “instance”) …');
  const esc = await fetch(`${base}/api/demo/escalations?status=pending`, {
    headers: { Cookie: cookieHeader() },
  });
  storeCookies(esc);
  const pending = await esc.json();
  console.log('pending', esc.status, Array.isArray(pending) ? pending.length : pending);
  if (!Array.isArray(pending) || pending.length < 1) {
    process.exitCode = 1;
    console.error('FAIL: cookie did not restore escalation');
    return;
  }

  const id = pending[0].id;
  console.log('POST resolve', id);
  const resolve = await fetch(`${base}/api/demo/escalations/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader(),
    },
    body: JSON.stringify({
      action: 'approve',
      human_response: 'Approve and continue with current direction',
    }),
  });
  storeCookies(resolve);
  const resolved = await resolve.json();
  console.log('resolve', resolve.status, resolved.status, resolved.next_pending_ids);

  const arts = await fetch(`${base}/api/demo/artifacts`, {
    headers: { Cookie: cookieHeader() },
  });
  storeCookies(arts);
  const artifacts = await arts.json();
  console.log('artifacts', arts.status, Array.isArray(artifacts) ? artifacts.length : artifacts);

  if (resolve.ok && Array.isArray(artifacts) && artifacts.length > 0) {
    console.log('PASS');
  } else {
    process.exitCode = 1;
    console.error('FAIL: expected report artifact after approve');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
