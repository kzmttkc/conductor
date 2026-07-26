# Conductor Heavy Dogfooding Report — Round 7

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Baseline:** Round 6 (search chrome, LLM rewrite×1, approve i18n, template goal overlays)  
**Focus:** LLM escalate findings copy, agent display names (EN→JA overlays), rewrite beyond 1-shot, tool labels, prefer-JA sources, marketing demo locale

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 7 closed the R6 P1 residuals without renaming runtime agent IDs:

1. **LLM escalate → `context.findings`** — last web_search hits attached; Needs You Sources accordion works on LLM path
2. **`agentLabel` / katakana names** — Scout→スカウト etc. on cards, detail, Needs You, templates, reports; DB names unchanged
3. **Rewrite ×2 + structured fallback** — second stricter rewrite; if still EN → structured `summaryKey`/`optionKeys` so chips localize
4. **Per-option locale heuristic** — each option must look Japanese (not only the combined blob)
5. **Tool permission i18n** — `web_search` → Web 検索
6. **Prefer Japanese sources** — Settings cookie → `agent.config.prefer_ja_sources` → stronger search bias
7. **Marketing NeedsYouMoment** — locale-aware summary, chips, Scout/Researcher labels

Final audit (Loop 10): **no P0**. Residual: free-form LLM report body may still mix languages; brand strings like “Needs You” stay bilingual by design.

---

## Loop 1 — Copy web_search into LLM escalate findings

### Personas (Cohort R7-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Akari Bessho | JP founder | Decide with evidence under LLM mode |
| 2 | Miles Ortega | EN PM | EN path still shows sources |
| 3 | Nanami Kure | Mobile JA | Sources accordion not empty |
| 4 | Omar Said | ESL | Trust escalate ask |
| 5 | Greta Holm | A11y | Accordion keyboard |
| 6 | Ren Fujimura | Analyst | Compare structured vs LLM |
| 7 | Caleb Ortiz | Engineer | Inspect context.findings |
| 8 | Amina Diallo | Privacy | Snippets only, no PII |
| 9 | Sora Ike | Student | First LLM Needs You |
| 10 | Victor Lang | Skeptic | Empty sources = bug |

### Complaints / opinions
- LLM Needs You Sources always “0” even after search

### Implemented
- Accumulate `searchFindings` in `runLlmAgentPass`
- Attach formatted findings + optional `summaryKey`/`optionKeys` in `runLlmPass` escalate context

### Audit (R7-B)
Pass when LLM called web_search before escalate.

---

## Loop 2 — Agent display-name overlays (UI)

### Personas (Cohort R7-B)
Yuna Morita, Brad Ellison, Chihiro Abe, Farid Khan, Elise Vaughn, Takuma Seo, Nora Berg, Kwame Boateng, Pia Rostova, Ian Mercer.

### Complaints / opinions
- Cards still said Scout / Verifier under JA UI
- Role was JA but name EN felt inconsistent

### Implemented
- `AGENT_NAME_JA` + `agentLabel` in `ja-overlays.ts`
- Wired: AgentCard, AgentDetailView, EscalationDecision banner/link

### Audit (R7-C)
Pass on primary surfaces. Remaining: Templates list names.

---

## Loop 3 — Templates page + JA template titles

### Personas (Cohort R7-C)
Mio Asato, Derek Vance, Haruna Ono, Luis Cabrera, Freja Dahl, Kaito Mori, Camille Roux, Tunde Okeke, Anja Weiss, Sean Park.

### Complaints / opinions
- Template cards: “Solo Scout” / agent “Scout”
- First-run still felt English-first

### Implemented
- `agentLabel` on templates agent rows
- Katakana/JA template titles in `ja-blurbs.ts` (ソロ・スカウト, 市場調査クルー, …)

### Audit (R7-D)
Pass. Remaining: rewrite still one shot.

---

## Loop 4 — Rewrite pass 2 + safer JSON parse

### Personas (Cohort R7-D)
Emi Kuroda, Jordan Pike, Rina Hase, Rafael Mendez, Liv Solberg, Shun Aoki, Chloe Tran, Yusuf Celik, Marta Nowak, Will Drake.

### Complaints / opinions
- Single rewrite often left English chips
- Markdown fences broke JSON parse

### Implemented
- Up to **2** rewrite attempts (stricter prompt / lower temperature on pass 2)
- Strip ```json fences before parse

### Audit (R7-E)
Pass for many drift cases. Remaining: total rewrite failure.

---

## Loop 5 — Structured optionKeys fallback after rewrite failure

### Personas (Cohort R7-E)
Ayaka Toda, Craig Nolan, Hina Suto, Diego Reyes, Ingrid Foss, Yuto Hara, Amélie Petit, Kofi Mensah, Lena Nowicki, Nate Cho.

### Complaints / opinions
- After failed rewrite, mismatch badge + unusable English chips

### Implemented
- `structuredEscalateFallback(theme, locale)` → JA summary + EN canonical options + `optionKeys`
- UI chips localize via existing formatters; mismatch cleared on fallback

### Audit (R7-F)
Pass — users always get JA chips after fallback.

---

## Loop 6 — Per-option locale heuristic

### Personas (Cohort R7-F)
Sakura Ide, Phil Brennan, Asuka Rei, Karim Nasser, Liv Jakobsen, Hiroto Sano, Zoe Hart, Abebe Lemma, Sophie Laurent, Max Keller.

### Complaints / opinions
- JA summary + EN options passed the combined heuristic

### Implemented
- `escalateMatchesLocale` requires Japanese summary **and** each option not mostly-Latin

### Audit (R7-G)
Pass — false negatives feed rewrite/fallback correctly.

---

## Loop 7 — Permission tool i18n

### Personas (Cohort R7-G)
Natsuki Mori, Ryan Decker, Kaori Miki, Lucía Fernández, Henrik Dahl, Misaki Oto, Tara Quinn, Malik Ibrahim, Greta Vogel, Ian Cho.

### Complaints / opinions
- Agent detail showed raw `web_search` / `file_write`

### Implemented
- `tool.web_search|browser|file_write` message keys
- AgentDetailView labels via `t(\`tool.${tool}\`)`

### Audit (R7-H)
Pass.

---

## Loop 8 — Report / log display names

### Personas (Cohort R7-H)
Fumiko Abe, Neil Caplan, Sakura Muto, Hassan Rahman, Pia Nilsen, Kohei Takeda, Claire Dupont, Tunde Adebayo, Eva Novák, Matt Ortiz.

### Complaints / opinions
- Reports titled `Scout: theme`; handoff logs “Handoff from Scout”

### Implemented
- `buildReport` / saveReport / composing log / defaultSystem use `agentLabel` + `roleLabel`
- Demo store handoff `i18nParams.name` localized

### Audit (R7-I)
Pass for new artifacts. Legacy EN titles still softened by formatters where patterns match.

---

## Loop 9 — Prefer Japanese sources toggle

### Personas (Cohort R7-I)
Reina Koga, Dylan Shore, Hikari Sato, Aisha Rahman, Tomáš Horák, Megumi Oda, Connor Blake, Selma Idris, Haruto Kin, Vivienne Cho.

### Complaints / opinions
- Want stronger JA SERP bias without claiming MT
- Setting should be explicit

### Implemented
- Cookie `conductor_prefer_ja_sources`
- Settings toggle
- Launch paths (templates + public-start) persist `config.prefer_ja_sources`
- `webSearch({ preferJaSources })` stronger query suffix

### Audit (R7-J)
Pass — next launch picks up preference.

---

## Loop 10 — Marketing + full audit

### Personas (Cohort R7-J — polish)
Keiko Fujita, Brett Mallory, Aoi Shimizu, Imani Okonkwo, Lars Berg, Mei Lin, Todd Greer, Haruka Ito, Priya Nair, Jonas Weber.

### Implemented polish
- `NeedsYouMoment` locale-aware (summary, options, Scout/Researcher labels, CTAs)
- Tour JA strings use スカウト
- tsc clean

### Audit personas (Cohort R7-K — independent)
| # | Name | Profile | Verdict |
|---|------|---------|---------|
| 1 | Yui Hoshino | JP founder | Pass — LLM Sources populated |
| 2 | Greg Palmer | EN PM | Pass — EN names unchanged |
| 3 | Chika Endo | Mobile JA | Pass — スカウト on cards |
| 4 | Noor Al-Sayed | ESL | Pass — fallback chips JA |
| 5 | Erik Lund | A11y | Pass — tool labels readable |
| 6 | Ryo Matsuda | Marketer | Pass — moment demo JA |
| 7 | Isabelle Petit | Engineer | Pass — rewrite×2 + fallback |
| 8 | Jamal Wright | Privacy | Pass — cookie preference only |
| 9 | Olga Petrov | Student | Pass — Templates JA |
| 10 | Sean Kim | Skeptic | Pass — runtime IDs still Scout |

**P0:** none  
**P1 residual:** LLM free-form report body language drift; “Needs You” product name stays EN/JA bilingual.

---

## Consolidated improvements

| Area | Change | Primary files |
|------|--------|----------------|
| LLM findings | Attach search hits to escalate context | `llm.ts`, `executor.ts` |
| Names | `agentLabel` overlays | `ja-overlays.ts`, AgentCard/Detail, EscalationDecision, templates |
| Rewrite | ×2 + structured fallback | `llm.ts`, `locale-text.ts` |
| Heuristic | Per-option JA check | `locale-text.ts` |
| Tools | `tool.*` i18n | messages, AgentDetailView |
| Search pref | Cookie + config + bias | settings, locale-server, web-search, launch paths |
| Marketing | Locale NeedsYouMoment | `NeedsYouMoment.tsx` |
| Templates | JA titles | `ja-blurbs.ts` |

---

## What we deliberately did **not** do

- Rename runtime `agent.name` values in DB / matchers (`agent.name === 'Verifier'`)
- Machine-translate open-web titles even with prefer-JA bias
- Infinite rewrite loops (cap = 2, then structured fallback)

---

## Recommended next round (R8) if needed

1. Soft language check / rewrite for final LLM report body (not only escalate)
2. Persist display-name map in i18n messages for community-contributed agents
3. Show “日本語ソース優先: オン” chip on agent detail when config set
4. Copy upstream snippets into escalate findings when LLM skips search

---

## Sign-off

Round 7 heavy dogfooding complete: **10 loops × 10 personas + 10 auditors**, feedback resolved in implementation, report filed at `dogfood/HEAVY_DOGFOOD_REPORT_R7.md`.
