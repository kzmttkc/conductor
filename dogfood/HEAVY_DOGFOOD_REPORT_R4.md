# Conductor Heavy Dogfooding Report — Round 4

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 3 (Settings/billing + Activity framework logs)  
**Focus:** Content-side English — escalation summaries/option chips, structured report chrome, artifact titles, plan-limit API prose

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 4 closed the content-side gaps Round 3 left open:

1. **Needs You summaries & option chips localize** — structured runtime strings via `summaryKey` / `optionKeys` + display formatters; stored EN kept for permission regex matching
2. **Structured report chrome localizes at read time** — headers, labels, boilerplate via `localizeReportMarkdown` (LLM body stays native)
3. **Artifact titles** — `Scout: theme` / `Pipeline summary:` format at display
4. **Plan/usage limit errors** — structured `code` + params → client `formatApiError`
5. **Permission copy** — “commander” → “your” in guard reasons; Activity patterns localize deny/approval lines

Final audit (Loop 10): **no P0** for structured content. Residual: free-form **LLM** escalate summaries/options and dynamic findings remain source language (by design).

---

## Loop 1 — Escalation option chips (structured)

### Personas (Cohort R4-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Nanami Ito | JP founder | Decide on Needs You in JA |
| 2 | Brett Callahan | EN PM | Confirm EN chips unchanged |
| 3 | Soo Park | Bilingual | Toggle JA mid-decision |
| 4 | Imani Okoye | ESL ops | Read Approve/Narrow/Pause |
| 5 | Lars Nilsson | Analyst | Tool-approval Allow/Deny chips |
| 6 | Hina Kato | Student | Timeout options |
| 7 | Quinn Adler | Engineer | Abort → Stop wording |
| 8 | Marisol Vega | Support | Toast shows JA summary |
| 9 | Tomohiro Abe | Mobile JA | Chip tap still resumes agent |
| 10 | Freya Shaw | Skeptic | Permission allow still grants tool |

### Complaints / opinions
- Option chips stayed English under JA UI
- “Abort the agent” felt harsh / military

### Implemented
- `formatEscalationOption` / `formatEscalationOptions`
- `escalate.option*` keys; display Stop wording in JA/EN catalog
- Canonical EN stored for `/allow web_search/i` resume matching
- Executor writes `optionKeys` on structured escalations

### Audit (R4-B)
Pass — chips JA, approve still resumes. Remaining: summary headline EN.

---

## Loop 2 — Escalation summary templates

### Personas (Cohort R4-B)
Nina Cho, Derek Holt, Yumi Sato, Omar Rahman, Celeste Dubois, Hiro Tanaka, Paige Winters, Kwame Mensah, Elena Rossi, Jack Byrne.

### Complaints / opinions
- Verifier / conflict / priority / timeout / tool-request summaries EN
- Dashboard Needs You bar and list showed EN

### Implemented
- `summaryKey` + `summaryParams` on escalate context
- `formatEscalationSummary` + pattern fallbacks for legacy rows
- Wired EscalationDecision, dashboard, escalations index, toasts, agent detail

### Audit (R4-C)
Pass for structured summaries. Remaining: artifact titles EN.

---

## Loop 3 — Artifact titles

### Personas (Cohort R4-C)
Rina Okada, Miles Trent, Amira Hassan, Gio Conti, Sakura Ide, Cole Brennan, Nadine Foss, Wei Zhang, Tess Morgan, Abel Dlamini.

### Complaints / opinions
- Results list: `Scout: …`, `Pipeline summary: …` always EN

### Implemented
- `formatArtifactTitle` + `artifact.*` keys
- Results index/detail, dashboard recent results, agent report card

### Audit (R4-D)
Pass. Remaining: report body section headers EN.

---

## Loop 4 — Structured report chrome

### Personas (Cohort R4-D)
Keiko Fujii, Aaron Blake, Lila Mendes, Piotr Kowalski, Mei Huang, Noah Greer, Zahra Ali, Enrique Soto, Anja Berg, Theo Kim.

### Complaints / opinions
- JA users saw English `## Executive summary`, Role/Mode labels, “Produced by…”
- “commander sign-off” residual in residual risks

### Implemented
- `localizeReportMarkdown` for known structured chrome
- Softened commander phrases in executor templates
- Copy clipboard uses localized markdown

### Audit (R4-E)
Pass for structured reports. LLM-authored body stays EN when model writes EN. Remaining: plan-limit toasts EN.

---

## Loop 5 — Plan / usage limit API errors

### Personas (Cohort R4-E)
Haruto Nishimura, Grace Ellison, Bastien Leroy, Priya Shah, Jonas Keller, Aya Onishi, Marcus Dean, Camila Ortiz, Ingrid Dahl, Yusuf Karim.

### Complaints / opinions
- Templates/agents/new showed raw English plan-limit prose
- Upgrade CTA hardcoded “Upgrade to Starter ($29/mo)”

### Implemented
- `formatApiError` + `errors.*` keys
- API USAGE_LIMIT includes `plan`, `n`, `metric`
- Templates + agents/new wire localized messages & upgrade CTA

### Audit (R4-F)
Pass. Remaining: permission deny log lines EN.

---

## Loop 6 — Permission-guard content

### Personas (Cohort R4-F)
Yuna Choi, Seth Palmer, Mio Hayashi, Rafa Silva, Claire Dupont, Kenji Ueda, Holly Grant, Omar Farid, Bianca Rossi, Luke Hart.

### Complaints / opinions
- “denied by commander permissions” in Activity
- Tool approval summary still mentioned commander mentally

### Implemented
- Guard reasons → “your permissions”
- Activity patterns for deny / needs-approval
- Tool escalate summaryKey + Allow/Deny optionKeys

### Audit (R4-G)
Pass. Remaining: pipeline summary markdown Stages/Notes.

---

## Loop 7 — Pipeline summary markdown chrome

### Personas (Cohort R4-G)
Asuka Hayashi, Ethan Brooks, Noor Alami, Jin Park, Sophie Laurent, Caleb Stone, Reina Sasaki, Diego Ruiz, Freja Lind, Amir Hassan.

### Complaints / opinions
- Pipeline summary H1 / Stages / Notes EN in Results

### Implemented
- `localizeReportMarkdown` covers `# Pipeline summary —`, `## Stages`, `## Notes`, upstream report headings

### Audit (R4-H)
Pass. Remaining: findings boilerplate lines inside report.

---

## Loop 8 — Findings boilerplate + Calling tool keys

### Personas (Cohort R4-H)
Mei Lin, Jordan Hayes, Taichi Mori, Lena Hoffman, Bridget Kane, Hyunwoo Jung, Chris Patel, Aiko Yamamoto, Samir Haddad, Nora Blake.

### Complaints / opinions
- “Web search denied…”, “No external findings…”, integrated upstream lines EN inside reports
- `Calling web_search` without write-time i18nKey

### Implemented
- Report boilerplate replacements in `localizeReportMarkdown`
- Softened search-denied source string in executor
- `Calling ${tool}` write-time `i18nKey`

### Audit (R4-I)
Pass. Remaining: LLM escalate free text.

---

## Loop 9 — LLM content boundary + copy consistency

### Personas (Cohort R4-I)
Riku Endo, Bethany Cole, Lucía Vega, Minh Tran, Olga Petrov, Quinton Ames, Isabel Moreau, Tyler Brooks, Amara Diallo, Hana Suzuki.

### Complaints / opinions
- Expect LLM chips to stay model language (OK if documented)
- Want structured path fully JA end-to-end

### Implemented
- Confirmed LLM escalate path keeps native summary/options (`source: 'llm'`)
- Structured path fully keyed; document residual in report
- Templates default theme chip uses locale message

### Audit (R4-J)
Pass for structured path. Ready for full audit.

---

## Loop 10 — Full-path audit (new cohort)

### Personas (Cohort R4-J)
| # | Name | Profile | Path |
|---|------|---------|------|
| 1 | Ayaka Mori | JP founder | JA demo → Needs You chips → approve → Results chrome |
| 2 | Owen Clark | EN growth | EN chips + report headers unchanged quality |
| 3 | Yui Nakamura | Mobile JA | Tool-approval Allow chip → agent resumes with search |
| 4 | Noah Klein | Screen reader | Localized chip labels + summary |
| 5 | Santiago Ruiz | ESL | Plan-limit banner JA on Templates |
| 6 | Mariko Endo | Marketer | Pipeline summary title + Stages JA |
| 7 | Caleb Stone | Engineer | Toggle EN↔JA on same Needs You — chips reformat |
| 8 | Freja Lind | Privacy | Report copy paste is localized |
| 9 | Hina Okada | Student | Timeout escalate options JA |
| 10 | Amir Hassan | Skeptic | LLM escalate (if any) may stay EN — acceptable |

### Verdict
**Pass — no P0** for structured content-side chrome. LLM-native escalate text and search snippets remain source language.

### Known residual (by design / P2)
- LLM `escalate_to_human` free-form summary/options
- Dynamic web-search snippets inside findings
- Some narrative sentences inside structured reports not exhaustively catalogued

---

## Cross-cutting inventory

| Area | Key artifacts |
|------|----------------|
| Escalate display | `format-content.ts`, `escalate.*`, EscalationDecision + lists/toasts |
| Write-time keys | `executor.ts` `summaryKey` / `optionKeys` |
| Reports | `localizeReportMarkdown`, Results detail + agent preview |
| Titles | `formatArtifactTitle` |
| API errors | `formatApiError`, templates/agents/new, USAGE_LIMIT fields |
| Permissions | `permission-guard.ts`, Activity `perm.*` patterns |

---

## Recommendation

Smoke before ship:

1. JA → public demo → Needs You: summary + 3 chips Japanese; Approve still resumes  
2. JA → Results: section headers Japanese; findings content intact  
3. JA → Templates over-limit: localized plan error + upgrade CTA  
4. Toggle EN on same escalation: chips/summary flip without rewrite  

Round 5 (optional): optional JA system prompts for LLM agents; catalog remaining narrative report sentences; structured option **ids** in DB (beyond display keys).
