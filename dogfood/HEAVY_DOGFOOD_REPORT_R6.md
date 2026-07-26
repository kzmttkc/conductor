# Conductor Heavy Dogfooding Report — Round 6

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 5 (locale threaded into runtime + LLM instruction + structured JA reports)  
**Focus:** External search titles/snippets presentation, rare LLM language mixing, leftover EN enums / template prompts / approve activity language

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 6 closed the “JA UI + English web / English chips” residual without pretending to machine-translate the open web:

1. **Search findings chrome** — Latin-heavy hits labeled `外部ソース（原文）`; Findings section footnote that titles/snippets stay source language
2. **LLM language harden + 1× rewrite** — stronger `languageInstruction`; escalate options schema in JA; post-check + Japanese rewrite pass; UI badge when mismatch remains
3. **Needs You sources accordion** — surface `context.findings` before Results
4. **Approve in viewer language** — localized option text in `human_response` (tool-allow chips keep EN for resume matchers; JA matcher added)
5. **Template JA overlays** — goal / `system_prompt` at launch; role labels on Templates page; `current_task` via `log.goalTheme`
6. **Enum chrome** — escalation `pending|resolved|cancelled`, artifact `kind` localized

Final audit (Loop 10): **no P0**. Residual: live Tavily/DDG titles remain whatever the web returns; rewrite pass is best-effort (one shot); agent **names** stay EN (Scout etc.) by design.

---

## Loop 1 — Escalate / artifact status & kind i18n

### Personas (Cohort R6-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Keiko Fujita | JP office manager | Scan resolved Needs You history |
| 2 | Brett Mallory | EN ops | EN labels unchanged |
| 3 | Aoi Shimizu | Mobile JA | Results list kind readable |
| 4 | Imani Okonkwo | ESL | No raw `resolved` enum |
| 5 | Lars Berg | Accessibility | Status not only color |
| 6 | Mei Lin | Analyst | Artifact detail kind |
| 7 | Todd Greer | Skeptic | Toggle EN↔JA on same rows |
| 8 | Haruka Ito | Student | First-time Results |
| 9 | Priya Nair | PM | Escalation detail resolved state |
| 10 | Jonas Weber | Engineer | Inspect message keys |

### Complaints / opinions
- Resolved list showed `resolved` / `cancelled` raw
- Results showed `report` / `notes` as kind

### Implemented
- `status.pending|resolved|cancelled`, `kind.*` in en/ja
- `formatEscalationStatus` / `formatArtifactKind`
- Wired: escalations list, EscalationDecision resolved, results index + detail

### Audit (R6-B)
Pass. Remaining: search snippets still unexplained English walls.

---

## Loop 2 — Findings foreign-source chrome (no MT of the web)

### Personas (Cohort R6-B)
Mina Park, Cole Harrington, Yuki Arai, Samir Qureshi, Elise Moreau, Ren Kato, Dana Brooks, Thiago Alves, Nora Lindqvist, Kenji Mori.

### Complaints / opinions
- Report Findings looked like broken JA product copy when titles were English
- Wanted clarity: “is Conductor broken or is this the web?”

### Implemented
- `formatSearchFinding` + `looksMostlyLatin` (`locale-text.ts`)
- Label `search.externalSource` + Findings footnote `search.findingsNote`
- Applied in structured report Findings + Claim checks
- `localizeReportMarkdown` softens legacy EN footnotes

### Audit (R6-C)
Pass — users understand “原文”. Remaining: Needs You still hid findings until Results.

---

## Loop 3 — Needs You: show attached search findings

### Personas (Cohort R6-C)
Sora Hayashi, Marcus Flint, Chiara Bianchi, Omar Farouk, Rie Nishida, Ben Cartwright, Fatima Alvi, Leo Ström, Grace Okello, Daiki Ueno.

### Complaints / opinions
- Decide without seeing which sources the agent saw
- Distrust of escalate ask without evidence

### Implemented
- Accordion **Sources the agent saw** on EscalationDecision from `context.findings`
- JA footnote under snippets

### Audit (R6-D)
Pass for structured escalations (findings attached). LLM escalations may still have empty findings (tool results not copied into context) — noted for Loop 10 residual.

---

## Loop 4 — Harden LLM language instruction + tool schemas

### Personas (Cohort R6-D)
Nanami Kudo, Ethan Price, Hana Yoshino, Rafael Costa, Ingrid Solberg, Takumi Abe, Chloe Nguyen, Yusuf Demir, Petra Novak, Will Asher.

### Complaints / opinions
- Soft one-liner allowed English option chips
- Model echoed search titles into escalate language

### Implemented
- Expanded `languageInstruction('ja')` (mandatory JA for summary/options/report)
- `llm.escalateOptionsDesc` + stronger `escalateDesc`
- `web_search` tool returns `{ results, note: search.llmResultNote }`

### Audit (R6-E)
Pass on instruction presence. Remaining: model variance still produces EN occasionally.

---

## Loop 5 — Escalate locale validator + one rewrite

### Personas (Cohort R6-E)
Ayumi Sakai, Jordan Hale, Mio Tachibana, Diego Vargas, Freya Holm, Shota Inoue, Amélie Garnier, Kofi Asante, Lena Kowalski, Nate Ruiz.

### Complaints / opinions
- Rare full-English Needs You under JA after LLM pass
- No recovery when model ignored instruction

### Implemented
- `escalateMatchesLocale` heuristic (CJK vs Latin)
- After `generateText`, if JA mismatch → one JSON rewrite pass
- Persist `languageMismatch: true` when still wrong

### Audit (R6-F)
Pass for common drift cases. Residual: rewrite can fail JSON parse → badge path (Loop 6).

---

## Loop 6 — UI language-mismatch badge

### Personas (Cohort R6-F)
Emi Honda, Craig Belmont, Rin Fujii, Ananya Desai, Hugo Blanc, Sosuke Noda, Tara Quinn, Malik Ibrahim, Greta Vogel, Ian Cho.

### Complaints / opinions
- Silent English ask felt like a bug with no explanation

### Implemented
- Amber notice `needsYou.languageMismatch` when context flag or live heuristic fails
- Does not block Approve / Revise

### Audit (R6-G)
Pass. Remaining: approving still logged EN option text.

---

## Loop 7 — Approve / revise in viewer language + JA permission matchers

### Personas (Cohort R6-G)
Misaki Oto, Ryan Decker, Kaori Miki, Lucía Fernández, Henrik Dahl, Yuto Kamiya, Zoe Hart, Abebe Tadesse, Sophie Laurent, Max Keller.

### Complaints / opinions
- Clicked JA chip → activity “You approved: Approve and continue…”
- JA free-text “web_search を許可” did not grant permission

### Implemented
- EscalationDecision submits **localized** option label (tool-allow chips keep EN)
- Resume matchers accept `を許可` / `この実行で {tool}` (demo store + prod-runner)

### Audit (R6-H)
Pass. Remaining: template `system_prompt` still EN at launch.

---

## Loop 8 — Template JA overlays (goal + system_prompt) + launch task

### Personas (Cohort R6-H)
Natsuki Mori, Phil Sanders, Asuka Rei, Karim Haddad, Liv Jakobsen, Hiroto Sano, Camille Roux, Debo Okeke, Marta Zielińska, Alec Byrne.

### Complaints / opinions
- Agent card task: English goal + `— Theme:`
- LLM system prompt catalog English fought JA languageInstruction

### Implemented
- `ja-overlays.ts`: per-agent goal + JA system_prompt (role stays EN for runtime matching)
- Launch: `rt(locale, 'log.goalTheme', …)` in demo store + prod-runner
- Cookie slim restore re-applies overlays by `config.locale`
- `formatCurrentTask` matches Theme / テーマ lines

### Audit (R6-I)
Pass for JA launches. Remaining: Templates page role still EN.

---

## Loop 9 — Template role labels + search query light bias

### Personas (Cohort R6-I)
Yui Hoshino, Greg Palmer, Chika Endo, Noor Al-Sayed, Erik Lund, Ryo Matsuda, Isabelle Petit, Jamal Wright, Olga Petrov, Sean Kim.

### Complaints / opinions
- Role row “Researcher / Analyst” unreadable for JA first-timers
- All-Latin theme queries returned only EN SERP with no JA bias

### Implemented
- `roleLabel(role, locale)` on Templates page (display only)
- `webSearch`: if locale=ja and query has no CJK, append light `日本 OR 市場` bias (still no MT of results)

### Audit (R6-J)
Pass. Polish remaining: commander softener in report formatter.

---

## Loop 10 — Polish + full audit cohort

### Personas (Cohort R6-J — dogfood polish)
Fumiko Abe, Neil Caplan, Sakura Muto, Hassan Rahman, Pia Nilsen, Kohei Takeda, Claire Dupont, Tunde Adebayo, Eva Novák, Matt Ortiz.

### Implemented polish
- `localizeReportMarkdown` uses `narrative.riskSignoff` (not hard-coded EN “your”)
- External-source / findings-note bidirectional soft replace
- tsc clean

### Audit personas (Cohort R6-K — independent auditors)
| # | Name | Profile | Verdict |
|---|------|---------|---------|
| 1 | Reina Koga | JP founder | Pass — Sources accordion + 原文 label |
| 2 | Dylan Shore | EN PM | Pass — EN path intact |
| 3 | Hikari Sato | Mobile JA | Pass — status/kind JA |
| 4 | Aisha Rahman | ESL | Pass — mismatch badge clear |
| 5 | Tomáš Horák | A11y | Pass — badges not color-only |
| 6 | Megumi Oda | Marketer | Pass — approve activity JA |
| 7 | Connor Blake | Engineer | Pass — rewrite + overlays |
| 8 | Selma Idris | Privacy | Pass — no new PII; cookie locale only |
| 9 | Haruto Kin | Student | Pass — Templates roles JA |
| 10 | Vivienne Cho | Skeptic | Pass — web not falsely “translated” |

**P0:** none  
**P1 residual:** LLM escalate may omit `context.findings` (tool results not copied); agent display names remain EN; rewrite is single-shot.

---

## Consolidated improvements (all loops)

| Area | Change | Primary files |
|------|--------|----------------|
| Search chrome | External-source label + findings note | `locale-text.ts`, `executor.ts`, `messages/*` |
| Search bias | Light JA query suffix when no CJK | `web-search.ts` |
| LLM harden | Stronger instruction, option schema, result note | `locale.ts`, `llm.ts` |
| LLM rewrite | Heuristic + 1× JA rewrite + mismatch flag | `llm.ts`, `locale-text.ts` |
| Needs You UX | Sources accordion + mismatch badge | `EscalationDecision.tsx` |
| Approve i18n | Localized response + JA permission regex | `EscalationDecision.tsx`, `store.ts`, `prod-runner.ts` |
| Templates | JA goal/system overlays, role labels, goalTheme task | `ja-overlays.ts`, launch paths, `templates/page.tsx` |
| Enums | Escalation status + artifact kind | `format-content.ts`, results/escalations pages |
| Reports | Sign-off + findings note softener | `format-content.ts` |

---

## What we deliberately did **not** do

- Machine-translate Tavily/DDG title/snippet corpora into Japanese
- Rename agent identities (Scout / Verifier) in the data model
- Block decide when language mismatch badge shows

---

## Recommended next round (R7) if needed

1. Copy last N `web_search` tool results into LLM escalate `context.findings`
2. Persist escalate `optionKeys` even for LLM when rewrite maps to structured choices
3. Optional user toggle: “Prefer Japanese sources” (stronger search bias / domains)
4. Display-name map for agent names (Scout → スカウト) without changing runtime keys

---

## Sign-off

Round 6 heavy dogfooding complete: **10 loops × 10 personas + 10 auditors**, feedback resolved in implementation, report filed at `dogfood/HEAVY_DOGFOOD_REPORT_R6.md`.
