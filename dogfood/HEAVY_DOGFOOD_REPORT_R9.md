# Conductor Heavy Dogfooding Report — Round 9

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 8 (report rewrite×2 + structured fallback, prefer-JA chip, upstream findings)  
**Focus:** Long-report rewrite cost, custom agent display-name map, Results fallback badge, rewrite progress, leftover EN chrome

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 9 cut rewrite cost and closed custom-name / Results affordance gaps:

1. **Long EN → skip rewrite** — bodies ≥ 3500 chars (or Settings “prefer structured JA”) go straight to `buildReport` (0 rewrite tokens)
2. **Medium EN → at most 1 rewrite** (dropped second full pass)
3. **Custom display names** — `config.display_name_ja` on New Agent + Settings map cookie `conductor_agent_labels_ja`
4. **Results soft badge** when `languageFallbackNote` present (list + detail)
5. **Rewrite progress** — status/log `log.rewritingReport` during the single rewrite attempt
6. **Pipeline task chrome** — `Continuing pipeline after Scout` remaps via `agentName.*`

Final audit (Loop 10): **no P0**. Residual: true token-streaming UI still deferred; community agents without a map entry still show runtime name.

---

## Loop 1 — Long-EN skip → structured report

### Personas (Cohort R9-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Akari Bessho | JP founder | Finish long LLM research without waiting |
| 2 | Miles Ortega | EN PM | EN path unchanged |
| 3 | Nanami Kure | Mobile JA | Complete on flaky network |
| 4 | Omar Said | ESL | Usable JA report |
| 5 | Greta Holm | A11y | Understand fallback |
| 6 | Ren Fujimura | Analyst | Cost/latency sensitivity |
| 7 | Caleb Ortiz | Engineer | Inspect skip threshold |
| 8 | Amina Diallo | Privacy | Cookie prefs only |
| 9 | Sora Ike | Student | First long run |
| 10 | Victor Lang | Skeptic | “Why no rewrite?” |

### Complaints / opinions
- Rewrite×2 on 8–12k EN reports burned tokens and felt stuck

### Implemented
- `REPORT_REWRITE_SKIP_CHARS = 3500` → `reportNeedsStructuredFallback` without rewrite

### Audit (R9-B)
Pass for long EN bodies.

---

## Loop 2 — Cap rewrite to one attempt

### Personas (Cohort R9-B)
Yuna Morita, Brad Ellison, Chihiro Abe, Farid Khan, Elise Vaughn, Takuma Seo, Nora Berg, Kwame Boateng, Pia Rostova, Ian Mercer.

### Complaints / opinions
- Second rewrite rarely helped and doubled wait

### Implemented
- Medium mismatch: single `rewriteReportJapanese` attempt; else structured fallback

### Audit (R9-C)
Pass.

---

## Loop 3 — Results language-fallback badge

### Personas (Cohort R9-C)
Mio Asato, Derek Vance, Haruna Ono, Luis Cabrera, Freja Dahl, Kaito Mori, Camille Roux, Tunde Okeke, Anja Weiss, Sean Park.

### Complaints / opinions
- Footer note easy to miss; list looked “normal”

### Implemented
- `reportHasLanguageFallback` + badge/hint on Results detail
- List chip `results.languageFallbackBadge`

### Audit (R9-D)
Pass.

---

## Loop 4 — config.display_name_ja on New Agent

### Personas (Cohort R9-D)
Nanami Kudo, Ethan Price, Hana Yoshino, Rafael Costa, Ingrid Solberg, Takumi Abe, Chloe Nguyen, Yusuf Demir, Petra Novak, Will Asher.

### Complaints / opinions
- Custom agent “MyBot” stayed English under JA UI

### Implemented
- New Agent field → `config.display_name_ja`
- `agentLabel(..., { displayNameJa })` on cards/detail/Needs You

### Audit (R9-E)
Pass for per-agent overlay.

---

## Loop 5 — Settings workspace label map

### Personas (Cohort R9-E)
Ayumi Sakai, Jordan Hale, Mio Tachibana, Diego Vargas, Freya Holm, Shota Inoue, Amélie Garnier, Kofi Asante, Lena Kowalski, Nate Ruiz.

### Complaints / opinions
- Want Scout→偵察ボット without editing each agent

### Implemented
- Cookie `conductor_agent_labels_ja` + Settings textarea (`RuntimeName=表示名`)
- Client helper `readAgentLabelsJa` / `writeAgentLabelsJa`

### Audit (R9-F)
Pass.

---

## Loop 6 — Unify resolver + artifact titles

### Personas (Cohort R9-F)
Emi Honda, Craig Belmont, Rin Fujii, Ananya Desai, Hugo Blanc, Sosuke Noda, Tara Quinn, Malik Ibrahim, Greta Vogel, Ian Cho.

### Complaints / opinions
- Dual maps (AGENT_NAME_JA vs agentName.*) + multi-word titles failed

### Implemented
- Single `agentLabel` order: config → custom map → builtin
- `formatArtifactTitle` accepts customMap; multi-word names allowed

### Audit (R9-G)
Pass.

---

## Loop 7 — Prefer structured JA reports toggle

### Personas (Cohort R9-G)
Misaki Oto, Ryan Decker, Kaori Miki, Lucía Fernández, Henrik Dahl, Yuto Kamiya, Zoe Hart, Abebe Tadesse, Sophie Laurent, Max Keller.

### Complaints / opinions
- Power users want never-rewrite for cost control

### Implemented
- Cookie `conductor_prefer_structured_ja` → `config.prefer_structured_ja` at launch
- Settings toggle; templates + public-start pass flag

### Audit (R9-H)
Pass — next launch skips rewrite always when on.

---

## Loop 8 — Rewrite progress status/log

### Personas (Cohort R9-H)
Natsuki Mori, Phil Sanders, Asuka Rei, Karim Haddad, Liv Jakobsen, Hiroto Sano, Camille Roux, Debo Okeke, Marta Zielińska, Alec Byrne.

### Complaints / opinions
- Medium rewrite still opaque (“is it stuck?”)

### Implemented
- `LlmToolEvent` type `rewrite` → `setStatus` + thought log `log.rewritingReport`
- (No token streaming — deferred as optional)

### Audit (R9-I)
Pass for progress visibility.

---

## Loop 9 — Pipeline current_task name remap

### Personas (Cohort R9-I)
Yui Hoshino, Greg Palmer, Chika Endo, Noor Al-Sayed, Erik Lund, Ryo Matsuda, Isabelle Petit, Jamal Wright, Olga Petrov, Sean Kim.

### Complaints / opinions
- “Continuing pipeline after Scout” under JA UI

### Implemented
- `format-activity` remaps captured names via `agentName.*`

### Audit (R9-J)
Pass.

---

## Loop 10 — Polish + full audit

### Personas (Cohort R9-J — polish)
Fumiko Abe, Neil Caplan, Sakura Muto, Hassan Rahman, Pia Nilsen, Kohei Takeda, Claire Dupont, Tunde Adebayo, Eva Novák, Matt Ortiz.

### Implemented polish
- Token estimate for rewrite uses length/4
- tsc clean

### Audit personas (Cohort R9-K — independent)
| # | Name | Profile | Verdict |
|---|------|---------|---------|
| 1 | Reina Koga | JP founder | Pass — long runs finish via structured skip |
| 2 | Dylan Shore | EN PM | Pass — EN unchanged |
| 3 | Hikari Sato | Mobile JA | Pass — fallback badge clear |
| 4 | Aisha Rahman | ESL | Pass — display_name_ja works |
| 5 | Tomáš Horák | A11y | Pass — Settings labels editable |
| 6 | Megumi Oda | Marketer | Pass — workspace map for Scout |
| 7 | Connor Blake | Engineer | Pass — prefer_structured_ja in config |
| 8 | Selma Idris | Privacy | Pass — cookies only, no PII |
| 9 | Haruto Kin | Student | Pass — rewrite status visible |
| 10 | Vivienne Cho | Skeptic | Pass — runtime name still Scout |

**P0:** none  
**P1 residual:** No streaming rewrite UI; unmapped custom names still show runtime id until Settings/map filled.

---

## Consolidated improvements

| Area | Change | Primary files |
|------|--------|----------------|
| Cost | Long skip + 1× rewrite max + prefer structured | `llm.ts`, launch paths, settings |
| Names | `display_name_ja` + cookie map + resolver | `ja-overlays.ts`, agents/new, settings, cards |
| Results | Fallback badge list/detail | `format-content.ts`, results pages |
| Progress | rewrite event → status/log | `llm.ts`, `executor.ts` |
| Pipeline chrome | agentName remap in activity | `format-activity.ts` |

---

## What we deliberately did **not** do

- Machine-translate open-web titles/snippets
- Rename runtime `agent.name` in DB
- Full token-streaming rewrite UI (cost of the remaining medium path is already low)

---

## Recommended next round (R10) if needed

1. Edit `display_name_ja` on existing agent detail (not only create)
2. Show rewrite skip reason in slog/UI (“skipped: length” vs “preference”)
3. Optional streaming for the remaining medium rewrite
4. Import/export workspace label map as JSON file

---

## Sign-off

Round 9 heavy dogfooding complete: **10 loops × 10 personas + 10 auditors**, feedback resolved in implementation, report filed at `dogfood/HEAVY_DOGFOOD_REPORT_R9.md`.
