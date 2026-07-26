# Conductor Heavy Dogfooding Report — Round 3

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 2 (JA locale, embed media, legal JA)  
**Focus:** Settings/billing chrome, server-generated Activity logs, residual EN surfaces (agents/new, results detail, OG metadata, a11y)

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 3 closed the P2 residuals called out after Round 2:

1. **Settings billing is fully localizable** — plan cards, Stripe checkout toasts, usage, developer accordion, reset confirm
2. **Activity / current_task logs localize** — `i18nKey` metadata on write + client `format-activity` pattern fallback for legacy EN strings
3. **agents/new + results/[id] + decision detail** wired to i18n
4. **OG / document metadata** follow `conductor_locale`
5. **Commander residue further reduced** in user-visible status (“Stopped by user”, recovery copy, default names)

Final audit (Loop 10): **no P0**. Residual P2: LLM-authored free text and some API plan-limit prose still English; escalation option chips from runtime remain EN by design (content, not chrome).

---

## Loop 1 — Settings billing body

### Personas (Cohort R3-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Ayaka Mori | JP founder | Change plan language on Settings |
| 2 | Brett Callahan | EN buyer | Complete demo plan switch |
| 3 | Soo Park | Bilingual PM | Toggle JA then open Billing |
| 4 | Imani Okoye | ESL ops | Understand “Current usage” |
| 5 | Lars Nilsson | Finance | Read Stripe checkout copy |
| 6 | Hina Kato | Student | Reset demo workspace confirm |
| 7 | Quinn Adler | Dev | Open Developer details |
| 8 | Marisol Vega | Support | Soft-limit warning language |
| 9 | Tomohiro Abe | Mobile JA | Templates link sublabel |
| 10 | Freya Shaw | Skeptic | Tool calls / AI mode lines |

### Complaints / opinions
- Settings body almost entirely English under JA
- “Launch another crew” / “Demo floor cleared” jargon

### Implemented
- Expanded `settings.*` keys (EN/JA)
- Full Settings page via `useT` including checkout/plan toasts

### Audit (R3-B)
Pass on Settings chrome. Remaining: plan card labels from `PLAN_LIMITS.label`.

---

## Loop 2 — Plan cards + Stripe toasts polish

### Personas (Cohort R3-B)
Nina Cho, Derek Holt, Yumi Sato, Omar Rahman, Celeste Dubois, Hiro Tanaka, Paige Winters, Kwame Mensah, Elena Rossi, Jack Byrne.

### Complaints / opinions
- Free/Starter/Pro/Scale labels always EN
- `/mo` and “Current plan” EN

### Implemented
- `plan.*` keys; Settings + PricingSection use `t('plan.{tier}')`
- Pricing `/mo` already localized; plan limits line via `settings.planLimits`

### Audit (R3-C)
Pass. Remaining: agents/new form EN.

---

## Loop 3 — agents/new form

### Personas (Cohort R3-C)
Rina Okada, Miles Trent, Amira Hassan, Gio Conti, Sakura Ide, Cole Brennan, Nadine Foss, Wei Zhang, Tess Morgan, Abel Dlamini.

### Complaints / opinions
- New agent form ignored locale entirely
- Upgrade toasts used English plan labels

### Implemented
- `agentsNew.*` catalog + full page wiring

### Audit (R3-D)
Pass. Remaining: results detail EN.

---

## Loop 4 — results/[id] + decision detail

### Personas (Cohort R3-D)
Keiko Fujii, Aaron Blake, Lila Mendes, Piotr Kowalski, Mei Huang, Noah Greer, Zahra Ali, Enrique Soto, Anja Berg, Theo Kim.

### Complaints / opinions
- Report detail / missing-report CTAs EN
- Escalation 404 / loading EN

### Implemented
- `results.*` detail keys; `decision.*` for escalations/[id]
- Relative time locale on results + escalations lists

### Audit (R3-E)
Pass. Remaining: Activity timeline English during live run.

---

## Loop 5 — Activity log catalog (client + metadata)

### Personas (Cohort R3-E)
Haruto Nishimura, Grace Ellison, Bastien Leroy, Priya Shah, Jonas Keller, Aya Onishi, Marcus Dean, Camila Ortiz, Ingrid Dahl, Yusuf Karim.

### Complaints / opinions
- Activity stream stayed English after JA toggle (“Report saved.”, “Stopped by commander”)
- Log type chips (`thought`/`action`) raw

### Implemented
- `src/i18n/format-activity.ts` (i18nKey + pattern fallback)
- `log.*` / `logType.*` messages
- AgentDetailView + EscalationDecision format content & types
- Soften “commander” → “user” in status strings

### Audit (R3-F)
Pass for known framework strings. Remaining: write-path metadata incomplete on some pipeline sites.

---

## Loop 6 — Pipeline / store / prod-runner write-path tags

### Personas (Cohort R3-F)
Yuna Choi, Seth Palmer, Mio Hayashi, Rafa Silva, Claire Dupont, Kenji Ueda, Holly Grant, Omar Farid, Bianca Rossi, Luke Hart.

### Complaints / opinions
- Pipeline handoff / gated / recovery still EN in fresh runs
- Want durable locale (switch JA↔EN after run)

### Implemented
- `i18nKey` / `i18nParams` on demo store, prod-runner, executor, agents API recovery log
- Pattern fallback covers legacy rows without metadata

### Audit (R3-G)
Pass for framework logs. Remaining: OG titles EN.

---

## Loop 7 — OG metadata + a11y chrome

### Personas (Cohort R3-G)
Asuka Hayashi, Ethan Brooks, Noor Alami, Jin Park, Sophie Laurent, Caleb Stone, Reina Sasaki, Diego Ruiz, Freja Lind, Amir Hassan.

### Complaints / opinions
- Shared links / tab titles ignore JA
- aria-labels (“Conductor home”, “Dismiss banner”) EN

### Implemented
- `buildRootMetadata` / `buildHomeMetadata` / `buildMomentMetadata`
- `a11y.*` on header/footer/nav/banner

### Audit (R3-H)
Pass when cookie=ja. Remaining: dashboard Needs You fallback EN.

---

## Loop 8 — Dashboard residual + current_task cards

### Personas (Cohort R3-H)
Mei Lin, Jordan Hayes, Taichi Mori, Lena Hoffman, Bridget Kane, Hyunwoo Jung, Chris Patel, Aiko Yamamoto, Samir Haddad, Nora Blake.

### Complaints / opinions
- Card “Awaiting decision: …” EN
- Dashboard empty Needs You blurb EN

### Implemented
- `formatCurrentTask` on AgentCard / AgentDetailView
- `dashboard.waitingDecision`

### Audit (R3-I)
Pass. Remaining: pricing plan names on marketing (fixed in Loop 2; re-verified).

---

## Loop 9 — Dictionary consistency + commander purge

### Personas (Cohort R3-I)
Riku Endo, Bethany Cole, Lucía Vega, Minh Tran, Olga Petrov, Quinton Ames, Isabel Moreau, Tyler Brooks, Amara Diallo, Hana Suzuki.

### Complaints / opinions
- Demo default name still “Commander” in some paths
- Recovery log still mentioned Commander

### Implemented
- Demo store default name → You
- Recovery / search-allow logs demilitarized + tagged

### Audit (R3-J)
Pass. Ready for full-path audit.

---

## Loop 10 — Full-path audit (new cohort)

### Personas (Cohort R3-J)
| # | Name | Profile | Path |
|---|------|---------|------|
| 1 | Nanami Ito | JP founder | JA Settings → plan switch → Templates → Needs You → Activity |
| 2 | Owen Clark | EN growth | EN Settings Stripe return toast |
| 3 | Yui Nakamura | Mobile JA | agents/new create + upgrade banner |
| 4 | Noah Klein | Screen reader | a11y labels JA |
| 5 | Santiago Ruiz | ESL | Results detail copy + relative time |
| 6 | Mariko Endo | Marketer | JA OG tab title on home/moment |
| 7 | Caleb Stone | Engineer | Pipeline handoff log in JA |
| 8 | Freja Lind | Privacy | Billing copy + developer accordion JA |
| 9 | Hina Okada | Student | Reset confirm JA → onboarding |
| 10 | Amir Hassan | Skeptic | Toggle EN↔JA mid-run; Activity re-formats |

### Verdict
**Pass — no P0.** Settings/billing, Activity framework logs, agents/new, results detail, and locale-aware metadata hold under re-audit.

### Known residual (P2 / content)
- Escalation **option chips** and LLM-written summaries remain source-language (runtime content)
- Some API `PLAN_LIMIT` error strings still English prose (structured codes partially present)
- Artifact titles like `Pipeline summary: …` not yet catalogued

---

## Cross-cutting inventory

| Area | Key artifacts |
|------|----------------|
| Settings billing | `settings/page.tsx`, `settings.*`, `plan.*` |
| Activity i18n | `format-activity.ts`, `log.*`, store/prod-runner/executor metadata |
| Forms / detail | `agents/new`, `results/[id]`, `escalations/[id]` |
| Metadata | `site-metadata.ts` → layout / home / moment |
| A11y | `a11y.*` on SiteHeader/Footer, CommandNav, CommandBanner |

---

## Recommendation

Smoke before ship:

1. JA → Settings → switch plan / open Billing / reset confirm  
2. JA → launch Solo Scout → Activity shows Japanese framework lines  
3. Toggle EN after a run — same logs reformat without rewrite  
4. JA → agents/new + results detail + home tab title  

Round 4 (optional): structured plan-limit API errors; localize escalation default options; catalog artifact titles.
