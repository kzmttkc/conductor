# Conductor Heavy Dogfooding Report — Round 8

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 7 (LLM escalate findings, agentLabel, rewrite×2 + structured escalate fallback)  
**Focus:** LLM final report body language drift, prefer-JA chip, upstream→escalate findings, leftover EN chrome

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 8 closed the R7 P1 residual on free-form report language and several JA UX leftovers:

1. **Report locale gate** — `reportMatchesLocale` (strip fences/URLs/external-source blocks) + rewrite×2
2. **Structured `buildReport` fallback** when rewrite still fails — with `report.languageFallbackNote`
3. **Upstream → escalate findings** when LLM skipped search — Sources accordion no longer empty
4. **Prefer-JA chip** on agent detail when `config.prefer_ja_sources`
5. **Tool toast / log i18n**, prod handoff `agentLabel`, artifact title `agentName.*`, condition labels, JA marketing Solo Scout → ソロ・スカウト

Final audit (Loop 10): **no P0**. Residual: rewrite cost on long reports; brand “Needs You” stays bilingual by design.

---

## Loop 1 — Report locale gate + rewrite×2

### Personas (Cohort R8-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Misato Kanda | JP founder | Read JA LLM report after Solo Scout |
| 2 | Owen Blake | EN PM | EN reports unchanged |
| 3 | Yui Naruse | Mobile JA | Open Results on phone |
| 4 | Samir Haddad | ESL | Trust deliverable language |
| 5 | Freya Holm | A11y | Report readable |
| 6 | Ren Okada | Analyst | Compare LLM vs structured |
| 7 | Caleb Shore | Engineer | Inspect rewrite path |
| 8 | Amina Diallo | Privacy | No new PII |
| 9 | Sora Ike | Student | First LLM complete |
| 10 | Victor Lang | Skeptic | English body = bug |

### Complaints / opinions
- Escalate chips JA, but final report still English walls

### Implemented
- `reportMatchesLocale` / `stripForReportLocaleCheck` in `locale-text.ts`
- `rewriteReportJapanese` ×2 in `llm.ts` when no escalate

### Audit (R8-B)
Pass when rewrite succeeds. Remaining: rewrite failure path.

---

## Loop 2 — Structured buildReport fallback for failed report rewrite

### Personas (Cohort R8-B)
Nina Cho, Derek Holt, Yumi Sato, Omar Rahman, Celeste Dubois, Hiro Tanaka, Paige Winters, Kwame Mensah, Elena Rossi, Jack Byrne.

### Complaints / opinions
- Prefer a clear structured JA report over broken English prose

### Implemented
- `reportNeedsStructuredFallback` → `buildReport` with search/upstream findings
- Footer note `report.languageFallbackNote` (+ display softener)

### Audit (R8-C)
Pass — JA users always get a usable report.

---

## Loop 3 — Upstream snippets into escalate findings

### Personas (Cohort R8-C)
Rina Okada, Miles Trent, Amira Hassan, Gio Conti, Sakura Ide, Cole Brennan, Nadine Foss, Wei Zhang, Tess Morgan, Abel Dlamini.

### Complaints / opinions
- Pipeline follower escalate: Sources = 0 despite upstream report

### Implemented
- `clipUpstreamFindings` when search findings empty
- Empty-state copy mentions search **or** upstream

### Audit (R8-D)
Pass for skip-search LLM escalate with upstream.

---

## Loop 4 — Prefer-JA chip on AgentDetailView

### Personas (Cohort R8-D)
Nanami Kudo, Ethan Price, Hana Yoshino, Rafael Costa, Ingrid Solberg, Takumi Abe, Chloe Nguyen, Yusuf Demir, Petra Novak, Will Asher.

### Complaints / opinions
- Settings toggle invisible after launch — “did it apply?”

### Implemented
- Chip `agent.preferJaOn` when `config.prefer_ja_sources`

### Audit (R8-E)
Pass.

---

## Loop 5 — Tool toast + LLM tool log labels

### Personas (Cohort R8-E)
Ayumi Sakai, Jordan Hale, Mio Tachibana, Diego Vargas, Freya Holm, Shota Inoue, Amélie Garnier, Kofi Asante, Lena Kowalski, Nate Ruiz.

### Complaints / opinions
- Toast `web_search → Allow` after JA tool labels on form

### Implemented
- `agent.permUpdated` with `t('tool.*')`
- LLM tool log `i18nParams.tool` localized via `rt(locale, tool.*)`

### Audit (R8-F)
Pass.

---

## Loop 6 — Prod handoff agentLabel parity

### Personas (Cohort R8-F)
Emi Honda, Craig Belmont, Rin Fujii, Ananya Desai, Hugo Blanc, Sosuke Noda, Tara Quinn, Malik Ibrahim, Greta Vogel, Ian Cho.

### Complaints / opinions
- Demo handoff “スカウト”, prod “Scout”

### Implemented
- `prod-runner` handoff `i18nParams.name` via `agentLabel`

### Audit (R8-G)
Pass.

---

## Loop 7 — Artifact title agentName remap

### Personas (Cohort R8-G)
Misaki Oto, Ryan Decker, Kaori Miki, Lucía Fernández, Henrik Dahl, Yuto Kamiya, Zoe Hart, Abebe Tadesse, Sophie Laurent, Max Keller.

### Complaints / opinions
- Legacy `Scout: theme` titles stayed English under JA UI

### Implemented
- `formatArtifactTitle` uses `agentName.*` keys
- `agentName` map in en/ja messages

### Audit (R8-H)
Pass.

---

## Loop 8 — JA marketing Solo Scout / Scout copy

### Personas (Cohort R8-H)
Natsuki Mori, Phil Sanders, Asuka Rei, Karim Haddad, Liv Jakobsen, Hiroto Sano, Camille Roux, Debo Okeke, Marta Zielińska, Alec Byrne.

### Complaints / opinions
- Demo/onboarding still said Solo Scout

### Implemented
- JA `demo.body`, `share.demoCaption`, `templates.blurb`, `help.step1`, `agents.new namePh`

### Audit (R8-I)
Pass.

---

## Loop 9 — Escalation condition labels

### Personas (Cohort R8-I)
Yui Hoshino, Greg Palmer, Chika Endo, Noor Al-Sayed, Erik Lund, Ryo Matsuda, Isabelle Petit, Jamal Wright, Olga Petrov, Sean Kim.

### Complaints / opinions
- Run details: raw `contradiction`, `paywall`

### Implemented
- `condition.*` keys + `formatEscalationCondition`

### Audit (R8-J)
Pass.

---

## Loop 10 — Polish + full audit

### Personas (Cohort R8-J — polish)
Fumiko Abe, Neil Caplan, Sakura Muto, Hassan Rahman, Pia Nilsen, Kohei Takeda, Claire Dupont, Tunde Adebayo, Eva Novák, Matt Ortiz.

### Implemented polish
- languageFallbackNote in `localizeReportMarkdown`
- tsc clean

### Audit personas (Cohort R8-K — independent)
| # | Name | Profile | Verdict |
|---|------|---------|---------|
| 1 | Reina Koga | JP founder | Pass — JA report or structured fallback |
| 2 | Dylan Shore | EN PM | Pass — EN path intact |
| 3 | Hikari Sato | Mobile JA | Pass — prefer-JA chip visible |
| 4 | Aisha Rahman | ESL | Pass — Sources from upstream |
| 5 | Tomáš Horák | A11y | Pass — conditions readable |
| 6 | Megumi Oda | Marketer | Pass — demo copy JA |
| 7 | Connor Blake | Engineer | Pass — rewrite + fallback flags |
| 8 | Selma Idris | Privacy | Pass — no new PII |
| 9 | Haruto Kin | Student | Pass — titles スカウト |
| 10 | Vivienne Cho | Skeptic | Pass — runtime IDs unchanged |

**P0:** none  
**P1 residual:** Long-report rewrite latency/cost; custom community agent names still fall through without `agentName` keys.

---

## Consolidated improvements

| Area | Change | Primary files |
|------|--------|----------------|
| Report language | Gate + rewrite×2 + structured fallback | `llm.ts`, `locale-text.ts`, `executor.ts` |
| Escalate sources | Upstream clips when no search | `locale-text.ts`, `executor.ts` |
| Prefer-JA UX | Detail chip | `AgentDetailView.tsx`, messages |
| Tool chrome | Toast + log labels | `AgentDetailView.tsx`, `executor.ts` |
| Pipeline | Prod handoff display name | `prod-runner.ts` |
| Titles / conditions | `agentName.*`, `condition.*` | `format-content.ts`, messages |
| Marketing | Solo Scout → ソロ・スカウト | `ja.ts` |

---

## What we deliberately did **not** do

- Machine-translate open-web titles/snippets inside reports
- Rename runtime `agent.name` in the database
- Infinite report rewrite loops (cap = 2, then structured fallback)

---

## Recommended next round (R9) if needed

1. Cache/skip rewrite when structured mode is already preferred
2. Allow custom agents to register display names in Settings
3. Streaming progress UI during report rewrite
4. Soft badge on Results when `languageFallbackNote` present

---

## Sign-off

Round 8 heavy dogfooding complete: **10 loops × 10 personas + 10 auditors**, feedback resolved in implementation, report filed at `dogfood/HEAVY_DOGFOOD_REPORT_R8.md`.
