# Conductor Heavy Dogfooding Report — Round 5

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 4 (structured escalate/report chrome at display time)  
**Focus:** LLM free-form Needs You text, search snippets/fallbacks, locale threaded into agent runtime, remaining narrative EN

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 5 closed the “content stays English because runtime never saw locale” gap:

1. **`conductor_locale` → agent runtime** — launch/resume/recover/public-demo APIs pass locale; persisted on `agent.config.locale`
2. **LLM instructed in locale** — system append + localized tool descriptions; `escalate_to_human` summary/options expected in JA when UI is JA
3. **Web search fallbacks localize** — Untitled / no-results / offline snippets via `search.*`
4. **Structured reports written in locale** — `buildReport` + pipeline summary use `rt(locale, …)`
5. **Display safety net kept** — Round 4 formatters still cover legacy EN rows and locale toggle

Final audit (Loop 10): **no P0** when cookie=ja before starting a run. Residual: third-party search result titles/snippets remain source language; LLM may occasionally mix languages (model variance).

---

## Loop 1 — Thread locale into runtime

### Personas (Cohort R5-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Ayaka Mori | JP founder | JA marketing → public demo |
| 2 | Owen Clark | EN PM | EN path unchanged |
| 3 | Yui Nakamura | Mobile JA | Templates launch keeps JA |
| 4 | Noah Klein | A11y | Resume after decide keeps locale |
| 5 | Santiago Ruiz | ESL | agents/new start with JA cookie |
| 6 | Mariko Endo | Marketer | Pipeline follower inherits locale |
| 7 | Caleb Stone | Engineer | Inspect `config.locale` |
| 8 | Freja Lind | Privacy | Cookie only, no PII |
| 9 | Hina Okada | Student | Recover after error keeps JA |
| 10 | Amir Hassan | Skeptic | Missing cookie defaults EN |

### Complaints / opinions
- Locale never reached executor; every new run authored English

### Implemented
- `resolveAgentLocale` / `rt` / `languageInstruction` (`src/lib/runtime/locale.ts`)
- `executeAgentPass({ locale })`; store + prod-runner persist `config.locale`
- APIs: public-start, templates, agents, agents/[id], escalations resume

### Audit (R5-B)
Pass — new agents carry `locale: 'ja'`. Remaining: LLM still EN without instruction.

---

## Loop 2 — LLM language instruction + tools

### Personas (Cohort R5-B)
Nina Cho, Derek Holt, Yumi Sato, Omar Rahman, Celeste Dubois, Hiro Tanaka, Paige Winters, Kwame Mensah, Elena Rossi, Jack Byrne.

### Complaints / opinions
- LLM Needs You chips/summary English under JA UI
- Tool schemas described only in English

### Implemented
- `runLlmAgentPass` appends `languageInstruction(locale)`
- Localized `web_search` / `escalate_to_human` descriptions
- Escalate context stores `source: 'llm', locale`
- Prompt lines via `llm.*` keys

### Audit (R5-C)
Pass when LLM available (instruction present). Remaining: offline search EN.

---

## Loop 3 — Web search fallback localization

### Personas (Cohort R5-C)
Rina Okada, Miles Trent, Amira Hassan, Gio Conti, Sakura Ide, Cole Brennan, Nadine Foss, Wei Zhang, Tess Morgan, Abel Dlamini.

### Complaints / opinions
- “Offline fallback for …”, “No structured results…” in findings/reports

### Implemented
- `webSearch(query, limit, { locale })` + `search.*` messages
- Structured + LLM tool paths pass locale

### Audit (R5-D)
Pass for fallback chrome. Live Tavily/DDG titles stay source language (acceptable).

---

## Loop 4 — Structured `buildReport` write-time locale

### Personas (Cohort R5-D)
Keiko Fujii, Aaron Blake, Lila Mendes, Piotr Kowalski, Mei Huang, Noah Greer, Zahra Ali, Enrique Soto, Anja Berg, Theo Kim.

### Complaints / opinions
- Even without LLM, narrative bullets stayed EN until display transform

### Implemented
- Locale-aware `buildReport` (verifier / synthesizer / scout templates)
- Findings boilerplate (`searchDenied`, `upstreamOnly`, `integratedUpstream`) via `rt`

### Audit (R5-E)
Pass for new structured reports. Remaining: pipeline summary Notes EN.

---

## Loop 5 — Pipeline summary locale

### Personas (Cohort R5-E)
Haruto Nishimura, Grace Ellison, Bastien Leroy, Priya Shah, Jonas Keller, Aya Onishi, Marcus Dean, Camila Ortiz, Ingrid Dahl, Yusuf Karim.

### Complaints / opinions
- Pipeline summary H1/Stages/Notes still EN at write

### Implemented
- `buildPipelineSummaryMarkdown` uses agent `config.locale` + `narrative.pipeline*`

### Audit (R5-F)
Pass. Remaining: legacy EN artifacts when toggled to JA.

---

## Loop 6 — Display safety net for legacy narrative

### Personas (Cohort R5-F)
Yuna Choi, Seth Palmer, Mio Hayashi, Rafa Silva, Claire Dupont, Kenji Ueda, Holly Grant, Omar Farid, Bianca Rossi, Luke Hart.

### Complaints / opinions
- Old reports written before R5 still English after JA toggle

### Implemented
- Expanded `localizeReportMarkdown` for search offline, checkedClaims, synthesis, pipeline id/notes, upstreamProvided, modeStructured

### Audit (R5-G)
Pass for known EN templates. Remaining: recover guidance EN to LLM.

---

## Loop 7 — Recover / resume guidance locale

### Personas (Cohort R5-G)
Asuka Hayashi, Ethan Brooks, Noor Alami, Jin Park, Sophie Laurent, Caleb Stone, Reina Sasaki, Diego Ruiz, Freja Lind, Amir Hassan.

### Complaints / opinions
- “Retry after error. Prefer safe sources.” always EN into next pass

### Implemented
- `llm.recoverGuidance` JA/EN; demo + prod recover use `rt(locale, …)`
- Resume APIs pass locale again

### Audit (R5-H)
Pass. Remaining: stop task wording in prod path.

---

## Loop 8 — Stop / cancel consistency

### Personas (Cohort R5-H)
Mei Lin, Jordan Hayes, Taichi Mori, Lena Hoffman, Bridget Kane, Hyunwoo Jung, Chris Patel, Aiko Yamamoto, Samir Haddad, Nora Blake.

### Complaints / opinions
- Prod cancel still “Stopped by commander”

### Implemented
- Escalations + agents stop → `Stopped by user` + i18nKey on cancel logs

### Audit (R5-I)
Pass. Ready for end-to-end LLM JA audit.

---

## Loop 9 — Public demo JA end-to-end

### Personas (Cohort R5-I)
Riku Endo, Bethany Cole, Lucía Vega, Minh Tran, Olga Petrov, Quinton Ames, Isabel Moreau, Tyler Brooks, Amara Diallo, Hana Suzuki.

### Complaints / opinions
- Want one-click `/demo` after setting JA to show Japanese Needs You

### Implemented
- `public-start` reads `getServerLocale()` into `launchTemplateAndRun`
- Structured path (no LLM key) already JA via keys + write-time report
- With LLM key: language instruction applied

### Audit (R5-J)
Pass for public demo with JA cookie. Ready for final cohort.

---

## Loop 10 — Full-path audit (new cohort)

### Personas (Cohort R5-J)
| # | Name | Profile | Path |
|---|------|---------|------|
| 1 | Nanami Ito | JP founder | JA → public demo → Needs You (structured or LLM) |
| 2 | Brett Callahan | EN growth | EN cookie → English escalate/report |
| 3 | Soo Park | Bilingual | Toggle after run; structured chips flip; LLM text stays as authored |
| 4 | Imani Okoye | ESL | Offline search snippet JA in findings |
| 5 | Lars Nilsson | Analyst | Pipeline summary Stages/Notes JA |
| 6 | Quinn Adler | Engineer | `config.locale` persisted across handoff |
| 7 | Marisol Vega | Support | Recover guidance JA into retry |
| 8 | Tomohiro Abe | Mobile | Templates launch JA |
| 9 | Freya Shaw | Skeptic | Live web titles may be EN — OK |
| 10 | Diego Ruiz | Product | Results narrative bullets JA for new runs |

### Verdict
**Pass — no P0** for locale-aware runtime authoring. Third-party search titles and occasional LLM language drift remain residual.

### Known residual (P2 / external)
- Search API result titles/snippets (source language)
- LLM may mix languages despite instruction
- Template `system_prompt` catalog still EN (overlaid by languageInstruction)

---

## Cross-cutting inventory

| Area | Key artifacts |
|------|----------------|
| Locale core | `src/lib/runtime/locale.ts` |
| LLM | `llm.ts` languageInstruction + tool copy + locale |
| Search | `web-search.ts` `search.*` |
| Executor | `buildReport` / structured findings / pass locale |
| Persist | `agent.config.locale` via store + prod-runner + APIs |
| Pipeline | `buildPipelineSummaryMarkdown` locale |
| Display net | `localizeReportMarkdown` expansions |

---

## Recommendation

Smoke before ship:

1. Set language **JA** → `/demo` Start → Needs You summary/options Japanese (structured always; LLM when keys present)  
2. Complete run → Results narrative sections Japanese  
3. Force offline search → snippet Japanese  
4. EN cookie control path still English  

Round 6 (optional): JA overlays for template system prompts; optional post-LLM MT safety net; status/kind enums in lists.
