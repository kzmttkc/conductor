# Conductor Heavy Dogfooding Report — Round 10

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 9 (long-skip rewrite, create-time display_name_ja, Settings map, Results badge)  
**Focus:** Edit display name on existing agents, rewrite skip reasons, streaming/progress for medium rewrite, label map JSON I/O, leftover EN chrome

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 10 closed the R9 “edit after create / opaque skip / stuck rewrite” residuals:

1. **PATCH `config.display_name_ja`** — merge-only; clear with `null`/`""`
2. **Agent detail edit UI** — JA display name field + save; runtime name shown; unmapped hint
3. **Rewrite skip reasons** — `length` / `preference` / `mismatch_after_rewrite` → activity log + slog
4. **Streamed medium rewrite** — `streamText` with progress events (`Localizing… (N chars)`); generateText fallback
5. **Label map JSON export/import** in Settings
6. **Chrome polish** — Waiting/priorHalt name remap, dashboard titles + customMap, prefer_structured chip, pipeline summary display names

Final audit (Loop 10): **no P0**. Residual: EN locale still hides the display-name editor (by design — JA overlay); very large streams still skip rewrite by length.

---

## Loop 1 — PATCH merge display_name_ja

### Personas (Cohort R10-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Akari Bessho | JP founder | Rename Scout display after launch |
| 2 | Miles Ortega | EN PM | EN path unchanged |
| 3 | Nanami Kure | Mobile JA | Edit on phone |
| 4 | Omar Said | ESL | Clear name back to default |
| 5 | Greta Holm | A11y | Label + save button |
| 6 | Ren Fujimura | Analyst | Persist across reload |
| 7 | Caleb Ortiz | Engineer | Inspect PATCH body |
| 8 | Amina Diallo | Privacy | No PII in cookies for this field |
| 9 | Sora Ike | Student | First edit |
| 10 | Victor Lang | Skeptic | Runtime id must stay Scout |

### Complaints / opinions
- Could set JA name only at create; PATCH rejected config

### Implemented
- Demo + prod PATCH: merge `config.display_name_ja` (max 80 chars); delete on empty/null

### Audit (R10-B)
Pass.

---

## Loop 2 — Agent detail display-name editor

### Personas (Cohort R10-B)
Yuna Morita, Brad Ellison, Chihiro Abe, Farid Khan, Elise Vaughn, Takuma Seo, Nora Berg, Kwame Boateng, Pia Rostova, Ian Mercer.

### Complaints / opinions
- Title read-only; no way to fix “MyBot” after create

### Implemented
- Detail: input + Save when `locale === 'ja'`
- Runtime name line; unmapped hint; toast success/fail

### Audit (R10-C)
Pass.

---

## Loop 3 — Rewrite skip reason (length vs preference)

### Personas (Cohort R10-C)
Mio Asato, Derek Vance, Haruna Ono, Luis Cabrera, Freja Dahl, Kaito Mori, Camille Roux, Tunde Okeke, Anja Weiss, Sean Park.

### Complaints / opinions
- Structured fallback felt random — “why no rewrite?”

### Implemented
- Events `rewrite_skip` with reason; logs `log.rewriteSkippedLength|Preference|Mismatch`
- slog `rewriteSkipReason` on complete

### Audit (R10-D)
Pass.

---

## Loop 4 — i18n for skip + progress strings

### Personas (Cohort R10-D)
Nanami Kudo, Ethan Price, Hana Yoshino, Rafael Costa, Ingrid Solberg, Takumi Abe, Chloe Nguyen, Yusuf Demir, Petra Novak, Will Asher.

### Complaints / opinions
- Raw keys or English progress in JA UI

### Implemented
- Message keys + `format-activity` matchers for progress lines

### Audit (R10-E)
Pass.

---

## Loop 5 — Streamed rewrite + progress heartbeats

### Personas (Cohort R10-E)
Ayumi Sakai, Jordan Hale, Mio Tachibana, Diego Vargas, Freya Holm, Shota Inoue, Amélie Garnier, Kofi Asante, Lena Kowalski, Nate Ruiz.

### Complaints / opinions
- Medium rewrite still felt frozen

### Implemented
- `rewriteReportJapanese` uses `streamText`; emits `rewrite_progress` every ~280 chars
- Status: `log.rewritingProgress` with `{n}`
- Falls back to `generateText` if stream fails

### Audit (R10-F)
Pass — progress updates during localize.

---

## Loop 6 — Settings JSON export/import

### Personas (Cohort R10-F)
Emi Honda, Craig Belmont, Rin Fujii, Ananya Desai, Hugo Blanc, Sosuke Noda, Tara Quinn, Malik Ibrahim, Greta Vogel, Ian Cho.

### Complaints / opinions
- Want to share/backup workspace label map

### Implemented
- Export downloads `conductor-agent-labels-ja.json`
- Import validates `Record<string,string>` and writes cookie + textarea

### Audit (R10-G)
Pass.

---

## Loop 7 — Waiting / priorHalt name remap

### Personas (Cohort R10-G)
Misaki Oto, Ryan Decker, Kaori Miki, Lucía Fernández, Henrik Dahl, Yuto Kamiya, Zoe Hart, Abebe Tadesse, Sophie Laurent, Max Keller.

### Complaints / opinions
- “Waiting for Scout to complete” under JA UI

### Implemented
- `format-activity` remaps Waiting/priorHalt names via `agentName.*`; status via `status.*`

### Audit (R10-H)
Pass.

---

## Loop 8 — Dashboard + detail artifact titles with customMap

### Personas (Cohort R10-H)
Natsuki Mori, Phil Sanders, Asuka Rei, Karim Haddad, Liv Jakobsen, Hiroto Sano, Camille Roux, Debo Okeke, Marta Zielińska, Alec Byrne.

### Complaints / opinions
- Results remapped titles; dashboard still “Scout: theme”

### Implemented
- Dashboard + agent detail report preview pass `customMap`

### Audit (R10-I)
Pass.

---

## Loop 9 — prefer_structured chip + pipeline summary names

### Personas (Cohort R10-I)
Yui Hoshino, Greg Palmer, Chika Endo, Noor Al-Sayed, Erik Lund, Ryo Matsuda, Isabelle Petit, Jamal Wright, Olga Petrov, Sean Kim.

### Complaints / opinions
- Settings toggle invisible on agent; pipeline summary listed EN names

### Implemented
- Detail chip `agent.preferStructuredOn`
- `buildPipelineSummaryMarkdown` uses `agentLabel` + localized status

### Audit (R10-J)
Pass.

---

## Loop 10 — Polish + full audit

### Personas (Cohort R10-J — polish)
Fumiko Abe, Neil Caplan, Sakura Muto, Hassan Rahman, Pia Nilsen, Kohei Takeda, Claire Dupont, Tunde Adebayo, Eva Novák, Matt Ortiz.

### Implemented polish
- File import via hidden input + button click
- tsc clean

### Audit personas (Cohort R10-K — independent)
| # | Name | Profile | Verdict |
|---|------|---------|---------|
| 1 | Reina Koga | JP founder | Pass — edit display name after launch |
| 2 | Dylan Shore | EN PM | Pass — EN path intact |
| 3 | Hikari Sato | Mobile JA | Pass — progress chars update |
| 4 | Aisha Rahman | ESL | Pass — skip reason readable |
| 5 | Tomáš Horák | A11y | Pass — Save display name labeled |
| 6 | Megumi Oda | Marketer | Pass — JSON export/import |
| 7 | Connor Blake | Engineer | Pass — slog rewriteSkipReason |
| 8 | Selma Idris | Privacy | Pass — display name in agent config only |
| 9 | Haruto Kin | Student | Pass — pipeline summary スカウト |
| 10 | Vivienne Cho | Skeptic | Pass — runtime name still Scout |

**P0:** none  
**P1 residual:** Display-name editor only in JA locale; community role labels still free-text EN unless user types JA role at create.

---

## Consolidated improvements

| Area | Change | Primary files |
|------|--------|----------------|
| Edit name | PATCH config + detail UI | `agents/[id]/route.ts`, `AgentDetailView.tsx` |
| Skip reason | Events + logs + slog | `llm.ts`, `executor.ts`, messages |
| Streaming | `streamText` + progress | `llm.ts`, `executor.ts` |
| Label I/O | JSON export/import | `agent-labels-client.ts`, settings |
| Chrome | Waiting remap, titles, chips, pipeline | `format-activity.ts`, dashboard, `pipeline.ts` |

---

## What we deliberately did **not** do

- Rename runtime `agent.name` in the database
- Machine-translate open-web titles/snippets
- Show JA display-name editor when UI locale is English (overlay is JA-facing)

---

## Recommended next round (R11) if needed

1. Optional EN-locale “alias” field (display_name for any locale)
2. Role display overlay editor similar to names
3. Persist label map server-side for signed-in users (not only cookie)
4. Surface rewriteSkipReason on Results badge tooltip

---

## Sign-off

Round 10 heavy dogfooding complete: **10 loops × 10 personas + 10 auditors**, feedback resolved in implementation, report filed at `dogfood/HEAVY_DOGFOOD_REPORT_R10.md`.
