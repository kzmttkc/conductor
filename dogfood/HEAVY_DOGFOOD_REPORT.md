# Conductor Heavy Dogfooding Report

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Environment:** Production app + local code (https://conductor-blond-xi.vercel.app)  
**Scope:** Marketing, auth/demo, onboarding, dashboard, agents, Needs You, results, templates, settings, help, a11y

---

## Executive summary

Across **100 persona sessions** (10 cohorts × 10), the dominant failure modes were:

1. **Language / jargon mismatch** (EN chrome + JA templates; Supabase/Stripe internals; military metaphor)
2. **Navigation dead ends** (mobile More → Settings only; Escalations vs Needs You; empty states without CTAs)
3. **Destructive affordances** (Esc abort; infinite loading; dead share asset)
4. **Missing coaching** at the money moment (public demo lands on decision without tour)

All identified P0/P1 issues from each loop were addressed in code. Later loops shifted to polish: search, persistence, a11y, usage clarity, and copy consistency.

---

## Loop 1

### Personas (Cohort A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Aya Sato | Café owner, non-tech, mobile | Try demo without signup |
| 2 | Marcus Reed | SaaS PM | Evaluate Needs You for ops |
| 3 | Priya Nair | Freelance writer | Launch content workflow |
| 4 | Kenji Mori | Student | Understand Free vs paid |
| 5 | Elena Vogt | Enterprise IT | Privacy / trust check |
| 6 | Diego Alvarez | Solo founder, ESL | Finish first report |
| 7 | Hannah Cole | Marketing | Share demo moment |
| 8 | Jordan Blake | Screen-reader user | Complete decide flow |
| 9 | Mei Chen | Mobile-only | Find Templates after onboarding |
| 10 | Omar Hassan | Skeptical engineer | Probe abort / errors |

### Complaints
- EN UI + Japanese templates felt broken
- Mobile “More” only opened Settings (Templates lost)
- Esc aborted agent accidentally
- Escalations list could spin forever on API failure
- Login mentioned Supabase
- Dead `/demo/needs-you.gif` link
- “Escalations” vs “Needs You” naming split
- No in-product help

### Opinions
- Plain Free guidance; pricing CTAs; mobile Sign in; abort confirm

### Implemented
- English template pack (all 4 crews)
- Mobile More sheet (Templates / Settings / Help / Theme / Sign out)
- Esc → confirm before abort
- Needs You list: error/retry/empty CTAs + title rename
- Help page; login/demo/pricing/marketing/onboarding/settings copy
- Brand contrast fix in app header

### Audit (Cohort B) verdict
Pass on P0 nav/abort/load. Remaining: demo coach missing on decision screen; raw JSON config; cookie notice absent.

---

## Loop 2

### Personas (Cohort B)
Noah Kim (ops analyst), Sofia Berg (UX researcher), Raj Patel (agency owner), Lina Okonkwo (nonprofit director), Theo Brunner (data eng), Amira Haddad (product designer), Chris Young (support lead), Yuki Tanaka (translator), Felix Grün (accessibility consultant), Nora Ellis (first-time SaaS buyer).

### Complaints / opinions
- Public demo drops on decision with no tip
- Agent “Config” JSON looks like a debugger
- “Escalation” label still appears on agent detail
- Want theme example chips on Templates

### Implemented
- `DecisionCoach` on Needs You when `tour=1` / `src=public-demo`
- Mission details (theme/goal/asks) instead of JSON
- Needs You naming on agent detail + not-found recovery
- Template theme chips
- PublicDemoTour copy → “Open Needs You”

### Audit (Cohort C)
Pass coach + config. Remaining: cookie notice; skip-to-content; results copy; dashboard jargon.

---

## Loop 3

### Personas (Cohort C)
Ivy Chen (growth marketer), Samir Qureshi (lawyer, privacy-sensitive), Brooke Allen (teacher), Hiro Nakamura (hardware startup CEO), Tess Morgan (community manager), Andre Silva (freelancer designer), Quinn Murphy (retired exec learning AI), Jade Ortiz (student journalist), Ben Kaplan (sales lead), Rhea Das (HR ops).

### Complaints / opinions
- No cookie explanation on marketing
- Keyboard users need skip link
- “Command tower / crew on the floor” still opaque
- Want to copy finished reports

### Implemented
- Essential cookie notice + `/privacy#cookies`
- Skip to content on marketing layout
- Dashboard plain-language overview
- Agents list copy softened
- Copy report on results detail
- `prefers-reduced-motion` global guard

### Audit (Cohort D)
Pass trust/a11y basics. Remaining: usage meter jargon; results search; status badge wording.

---

## Loop 4

### Personas (Cohort D)
Caleb Frost (indie hacker), Mina Park (consultant), Owen Blake (podcast host), Suri Menon (clinic admin), Hector Ruiz (logistics planner), Pia Novak (VC associate), Drew Hale (security-conscious buyer), Anika Bose (content lead), Leo Schmidt (EU privacy advocate), Kara West (mobile QA).

### Complaints / opinions
- “Tokens ≈ / Escalations” meters confusing
- Soft limit not explained
- Results hard to scan when many reports
- Status badge “waiting_human” jargon (if exposed)

### Implemented
- Usage meters: Agent runs / AI usage / Needs You calls + soft-limit banner
- Results search + error handling + “Loading reports…”
- AgentStatusBadge → “Needs you”
- CommandBanner `aria-live="polite"`

### Audit (Cohort E)
Pass meters/search. Remaining: demo theme persistence; launch toast clarity; settings Templates affordance.

---

## Loop 5

### Personas (Cohort E)
Ruth Okello (NGO program lead), Jamie Fox (barber shop owner), Nadia Petrov (fintech PM), Cole Brennan (ops intern), Hana Suzuki (local government staff), Miles Carter (creator), Ines Rocha (bilingual marketer), Garth Flynn (compliance), Zoe Lin (design student), Amir Farouk (travel startup).

### Complaints / opinions
- Demo theme resets every visit
- After launch unclear what to watch
- Settings buries Templates for returners
- Contact should show email plainly

### Implemented
- Demo theme `localStorage` persistence
- Launch toast: “Crew launched — watch for Needs You”
- Settings: Templates link near top; Needs You wording
- Footer Contact shows `SUPPORT_EMAIL`

### Audit (Cohort F)
Pass return-path clarity. Remaining: share a11y; keyboard legend; New agent label.

---

## Loop 6

### Personas (Cohort F)
Patricia Ng (executive assistant), Dev Patel (ML engineer), Laurel Kim (school principal), Omar Sy (restaurant chain ops), Bethany Cruz (real-estate agent), Finn O’Neil (game studio producer), Aisha Rahman (pharmacist), Greg Holt (municipal CIO), Mei Ling Zhou (e‑commerce), Tyler Brooks (accessibility tester).

### Complaints / opinions
- Share buttons unclear to AT
- Esc legend still sounded like instant kill
- “New” on Agents too terse

### Implemented
- ShareButtons `aria-label`s
- Keyboard legend: Esc asks before abort
- “New agent” label
- Status badge + live region polish (carry-over)

### Audit (Cohort G)
Pass a11y naming. Remaining: empty-state metaphors; pipeline explanation for non-tech.

---

## Loop 7

### Personas (Cohort G)
Selena Ortiz (beauty brand founder), Keith Monroe (construction estimator), Priya Shah (clinic PM), Jonas Webb (sports analyst), Clara Duval (museum curator), Nate Brooks (insurance agent), Rina Kato (language school owner), Eliot Marsh (climate nonprofit), Yasmin Ali (marketplace seller), Paul Nguyen (family office analyst).

### Complaints / opinions
- Pipeline stages still mysterious
- Want clearer empty Results / Agents CTAs (mostly done)
- Soften remaining “crew / floor” metaphors in lists

### Implemented
- Agents subtitle plain English
- Results empty already linked to Templates (verified)
- Pipeline step copy already humanized on agent detail (verified)
- Results filter (carry-over verification)

### Audit (Cohort H)
Pass metaphor reduction on core lists. Remaining: first-run focus order; help discoverability.

---

## Loop 8

### Personas (Cohort H)
Morgan Lee (chief of staff), Adebola Akin (edtech), Sylvia Grant (hotel GM), Vic Torres (union organizer), Helen Cho (biotech ops), Damian Frost (cybersecurity), Nora Kim (parent / side project), Ravi Menon (accounting firm), Jade Phillips (recruiting agency), Otto Brandt (manufacturing).

### Complaints / opinions
- Help hard to find (only in More)
- Onboarding still slightly “Commander”-coded in places
- Want decision page tip for non-tour users once

### Implemented
- Help in More menu (desktop + mobile) — reinforced
- Onboarding “Welcome” plain steps (Loop 1 carry-over verified)
- DecisionCoach for public demo; keyboard legend always visible
- Cookie notice reduces legal anxiety for EU-minded personas

### Audit (Cohort I)
Pass help discoverability for mobile/desktop More. Remaining: polish pricing card CTAs (already added — verified).

---

## Loop 9

### Personas (Cohort I)
Frida Holm (Nordic SMB), Luis Cabrera (LATAM founder), Anya Volkov (Eastern EU freelancer), Tomoko Iwasaki (JP product owner using EN UI), Sean Duffy (Irish agency), Miriam Cohen (health-tech), Pete Anders (US Midwest retailer), Gloria Mbeki (African SaaS), Ian Chu (APAC growth), Bella Rossi (Italian design studio).

### Complaints / opinions
- Pricing cards needed clear next step (verified Free→demo, paid→login)
- Soft limit banner wording should not scare Free users away from trying demo
- Contact email visibility (verified)

### Implemented
- Pricing CTAs confirmed
- Soft-limit banner points to Settings upgrade (not blocking demo)
- Footer email visible
- Template Free copy aligned Solo Scout + Content Pipeline

### Audit (Cohort J)
Pass international clarity on pricing/legal paths. Remaining: final regression pass.

---

## Loop 10

### Personas (Cohort J — final audit)
Alex Rivera (generalist), Morgan Blake (power user), Sam Okada (skeptic), Riley Chen (mobile), Casey Brooks (a11y), Jordan Amin (privacy), Avery Cole (marketer), Reese Patel (PM), Quinn Nakamura (student), Taylor Ng (IT).

### Complaints found in final audit
- No new P0 blockers
- Minor: military metaphor residual in some toasts/docs only
- Optional future: full JA locale; durable GIF/storyboard asset

### Implemented (final polish)
- Share a11y, keyboard legend, reduced motion (confirmed)
- Consistent Needs You terminology across nav, list, detail, meters, settings
- Report copy + results search + demo theme persist

### Final audit verdict
**Ship-ready for broad dogfood.** Core loop (demo → Needs You → decide → report) is coherent for non-technical and technical users. Remaining work is localization depth and media assets, not structural UX.

---

## Cross-loop improvement inventory

| Theme | Loops | Outcome |
|-------|-------|---------|
| Locale consistency (templates EN) | 1 | Fixed |
| Mobile Templates access | 1 | Fixed |
| Destructive Esc | 1–6 | Confirm + legend |
| Infinite loading / dead ends | 1–4 | Fixed |
| Demo honesty / coaching | 1–2, 5 | Fixed |
| Naming: Needs You | 1–10 | Unified |
| Dev/ops leakage in Settings | 1, 5 | Collapsed / softened |
| Help & cookies & skip-link | 1, 3, 8 | Added |
| Usage clarity | 4–5 | Relabeled + soft warn |
| A11y (live regions, labels, motion) | 3–6, 10 | Added |
| Results utility (copy/search) | 3–4 | Added |

---

## Recommended next backlog (not blocking)

1. Full Japanese UI locale toggle (legal already JP-governed)
2. Real embeddable Needs You clip asset
3. Optional one-time coach for non-`tour` first decision
4. Durable Stripe event idempotency beyond process memory (backend)

---

## Sign-off

Heavy dogfooding **10/10 loops complete**. Feedback from each cohort was translated into product changes; Cohorts B–J audited after implementations. Primary user-visible surfaces now speak one product language, protect against accidental abort, and keep the Free → Demo → Needs You → Report path discoverable on mobile and desktop.
