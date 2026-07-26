#!/usr/bin/env node
/**
 * Captures the Needs You moment for marketing.
 *
 * Usage:
 *   node scripts/capture-needs-you-demo.mjs [baseUrl]
 *
 * Requires: local or deployed Conductor with Demo Mode,
 * and optional `ffmpeg` for GIF assembly.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:3000';
const outDir = path.resolve('public/demo');

async function main() {
  await mkdir(outDir, { recursive: true });

  const start = await fetch(`${base}/api/demo/public-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: 'AI agent orchestration market 2026' }),
  });
  if (!start.ok) {
    throw new Error(`public-start failed: ${start.status} ${await start.text()}`);
  }
  const setCookie = start.headers.getSetCookie?.() || [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  const payload = await start.json();
  console.log('Started demo agents:', payload.agents?.map((a) => a.name).join(', '));

  // Poll until escalation
  let escalation = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(`${base}/api/demo/escalations?status=pending`, {
      headers: { Cookie: cookie },
    });
    const list = await res.json();
    if (Array.isArray(list) && list[0]) {
      escalation = list[0];
      break;
    }
    process.stdout.write('.');
  }
  console.log('');

  if (!escalation) {
    throw new Error('No escalation appeared — cannot capture Needs You moment');
  }

  const storyboard = {
    capturedAt: new Date().toISOString(),
    base,
    escalation: {
      id: escalation.id,
      summary: escalation.summary,
      options: escalation.options,
    },
    urls: {
      demo: `${base}/demo`,
      moment: `${base}/demo/moment`,
      decide: `${base}/escalations/${escalation.id}`,
      dashboard: `${base}/dashboard?tour=1`,
    },
    recordingTips: [
      'Record 1280x720 or 1080p, 15–30 seconds',
      'Start on /demo → click Start → wait for red banner',
      'Click Decide → press A → show resume',
      'Caption: “When agents need judgment, Conductor makes it a 3-second decision.”',
    ],
  };

  await writeFile(
    path.join(outDir, 'needs-you-storyboard.json'),
    JSON.stringify(storyboard, null, 2)
  );
  console.log('Wrote public/demo/needs-you-storyboard.json');

  // Fetch static moment page HTML snapshot note
  const moment = await fetch(`${base}/demo/moment`);
  await writeFile(
    path.join(outDir, 'moment-status.txt'),
    `moment_http=${moment.status}\nshare_url=${base}/demo/moment\n`
  );

  const ffmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (ffmpeg.status === 0) {
    console.log(
      'ffmpeg available. After taking screenshots into public/demo/frames/%03d.png, run:'
    );
    console.log(
      '  ffmpeg -y -framerate 1.2 -i public/demo/frames/%03d.png -vf "scale=960:-1:flags=lanczos" -loop 0 public/demo/needs-you.gif'
    );
  } else {
    console.log('ffmpeg not found — use QuickTime/Kap to record /demo flow (see storyboard).');
  }

  console.log('\nOpen these URLs now:');
  console.log(' ', storyboard.urls.moment);
  console.log(' ', storyboard.urls.decide);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
