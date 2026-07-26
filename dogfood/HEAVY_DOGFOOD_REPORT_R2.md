# Conductor Heavy Dogfooding Report — Round 2

**Period:** 2026-07-26  
**Method:** 10 loops × 10 personas → full product use → complaints/opinions → implement fixes → audit with a new cohort of 10  
**Environment:** Local codebase (post Round 1 production baseline)  
**Focus (beyond structural UX):** JA locale, embeddable media, share captions, legal language, demilitarized copy, date/number locale, JA typography

---

## Executive summary

Across **100 persona sessions** (10 new cohorts × 10), Round 2 closed the gaps Round 1 left open:

1. **JA locale is real** — cookie `conductor_locale`, `html lang`, marketing + money-path chrome, Needs You decide, agent detail, share, legal, meters, tour, template chips
2. **Embeddable media works** — GIF/still on `/demo/moment` with reduced-motion fallback + download affordance
3. **Share captions localize** — EN/JA defaults for moment & public demo
4. **Military metaphor further reduced** — Mission details → Run details; Standing by for orders → Idle; Abort → Stop; default name Commander → You
5. **Legal is bilingual** — Privacy / Terms body + chrome follow locale

Final audit (Loop 10) found **no P0 blockers** for JA or media paths. Residual: some settings/billing strings and agent runtime log lines remain English (backend-authored).

---

## Loop 1 — JA foundation + marketing

### Personas (Cohort R2-A)
| # | Name | Profile | Job to be done |
|---|------|---------|----------------|
| 1 | Haruka Ito | JP café owner, mobile | Browse home in Japanese |
| 2 | Liam O’Brien | EN marketer | Confirm EN still default |
| 3 | Soo-jin Park | Bilingual PM | Toggle EN↔JA and refresh |
| 4 | Adebola Okeke | ESL founder | Find language control |
| 5 | Chiara Romano | Privacy-conscious buyer | Open Privacy from footer |
| 6 | Ren Takahashi | Student, JA | Read pricing in JA |
| 7 | Miles Quinn | Designer | Check brand + locale UI |
| 8 | Fatima Al-Rashid | Accessibility tester | Skip link + lang |
| 9 | Jonas Berg | Skeptic | Cookie notice mentions language |
| 10 | Naomi Fujita | Ops lead | Moment page in JA |

### Complaints / opinions
- Entire product felt English-only for JA users
- No persistent language preference
- Cookie notice didn’t mention language cookies

### Implemented
- `src/i18n/` (en/ja messages, cookie, `LocaleProvider`, `useT`)
- `LocaleToggle` in marketing header + app More menu
- Marketing home/demo/moment/login/footer/header/cookie wired
- `html lang` from server cookie + client sync
- Noto Sans JP font variable for CJK glyphs

### Audit (Cohort R2-B) verdict
Pass on toggle persistence. Remaining: decide screen & agent detail still EN; GIF not embedded.

---

## Loop 2 — Embeddable Needs You media

### Personas (Cohort R2-B)
Grace Liu (growth), Henrik Solberg (deck maker), Aisha Rahman (social), Tomoya Kudo (agency), Ella Frost (brand), Victor Mendes (sales eng), Inès Dubois (content), Kai Nakamura (community), Ruth Stein (PR), Omar Farouk (founder).

### Complaints / opinions
- `/demo/needs-you.gif` existed but wasn’t shown in product UI
- Reduced-motion users need a still
- Want download for posts/decks

### Implemented
- `EmbeddableNeedsYou` on moment page (GIF + still)
- Download link for GIF/still
- Figcaption localized

### Audit (Cohort R2-C) verdict
Pass on embed/reduced-motion. Remaining: share buttons EN-only; no GIF download discovered without reading caption (fixed via explicit download link).

---

## Loop 3 — Share captions JA

### Personas (Cohort R2-C)
Yuna Choi, Brad Keller, Melati Putri, Soren Lind, Priya Desai, Carlo Ricci, Ayumi Sato, Jamal Wright, Helena Costa, Wei Chen.

### Complaints / opinions
- Share default caption always English when UI is JA
- Toast “Link copied” EN

### Implemented
- `share.*` message keys
- `ShareButtons` via `useT`
- Demo page uses `share.demoCaption`

### Audit (Cohort R2-D) verdict
Pass. Remaining: decide path still EN.

---

## Loop 4 — Needs You decide JA + Stop wording

### Personas (Cohort R2-D)
Keiko Matsuda (JP ops), Darren Shaw (support), Lucía Vega (ESL), Minh Tran (mobile), Olga Petrov (a11y), Samir Haddad (power user), Bethany Cole (PM), Riku Endo (student), Nora Blake (first-time), Quinton Ames (engineer).

### Complaints / opinions
- Money moment (Approve/Revise/Abort) English while chrome JA
- “Abort” felt harsh / military
- Toast “Agent needs you” EN

### Implemented
- Full `EscalationDecision` i18n
- Abort CTA → Stop / 中止
- `useEscalations` toast localized via `document.documentElement.lang`

### Audit (Cohort R2-E) verdict
Pass on decide path. Remaining: agent detail “Mission details”.

---

## Loop 5 — Agent detail demilitarize + JA

### Personas (Cohort R2-E)
Isabel Moreau, Ken Watanabe, Tyler Brooks, Amara Diallo, Piotr Nowak, Hana Suzuki, Craig Nolan, Leila Mansour, Diego Ruiz, Freya Olsen.

### Complaints / opinions
- “Mission details”, “Standing by for orders”, “Commander” default name
- Permissions labels EN-only

### Implemented
- `AgentDetailView` + `AgentCard` i18n
- Run details / Idle waiting copy
- Default display name → You / あなた (auth, demo session, nav fallback)

### Audit (Cohort R2-F) verdict
Pass. Remaining: legal pages EN-only.

---

## Loop 6 — Legal JA + demilitarized copy

### Personas (Cohort R2-F)
Elena Vogt (IT), Hiroshi Abe (legal-curious), Maya Singh, Owen Clark, Zara Ahmed, Nils Jansson, Camila Rojas, Jin Park, Theo March, Yuki Morita.

### Complaints / opinions
- Privacy/Terms always English; “command tower” / “mission themes” jargon
- Legal chrome (“Last updated”, “Back home”) EN

### Implemented
- `PrivacyBody` / `TermsBody` EN+JA (`src/content/legal.tsx`)
- Locale-aware pages + `generateMetadata`
- `LegalDoc` chrome via messages; softened EN legal wording

### Audit (Cohort R2-G) verdict
Pass when cookie=ja. Remaining: relative times EN (“5m ago”).

---

## Loop 7 — Date/number locale + usage meters

### Personas (Cohort R2-G)
Anika Bose, Felix Weber, Sakura Inoue, Marcus Cole, Nadia Hassan, Leo Martins, Chloe Ng, Ivan Petrov, Rina Kato, Jules Petit.

### Complaints / opinions
- Relative times and pricing numbers ignore JA
- Usage meter soft-limit always EN

### Implemented
- `formatRelativeTime(date, locale)` with `time.*` keys
- Pricing `toLocaleString(ja-JP|en-US)`
- `UsageMeters` via `usage.*`

### Audit (Cohort R2-H) verdict
Pass. Remaining: template theme chips EN.

---

## Loop 8 — Templates JA completion + tour

### Personas (Cohort R2-H)
Mei Lin, Jordan Hayes, Aiko Yamamoto, Chris Patel, Sophie Laurent, Taichi Mori, Lena Hoffman, Omar Sy, Bridget Kane, Hyunwoo Jung.

### Complaints / opinions
- Template cards JA but chips/placeholder EN
- Public demo tour EN

### Implemented
- `templatesExtra.*` chips + placeholder
- `TEMPLATE_JA` blurbs (already wired) verified
- `PublicDemoTour` i18n

### Audit (Cohort R2-I) verdict
Pass. Remaining: JA font coverage weak on some glyphs.

---

## Loop 9 — Typography + dictionary polish

### Personas (Cohort R2-I)
Reina Sasaki, Paul Grant, Noor Alami, Enzo Bianchi, Kira Novak, Dana Wells, Shohei Ito, Amélie Roux, Gabe Torres, Linh Pham.

### Complaints / opinions
- Montserrat alone poorly renders Japanese
- Leftover EN strings in JA dictionary (`footer.rights`, `app.decide`, moment step3)

### Implemented
- `Noto_Sans_JP` in root layout + CSS stack
- JA dictionary leftovers fixed
- Dashboard “Drag to reorder” localized

### Audit (Cohort R2-J) verdict
Pass for reading comfort. Remaining: odd settings billing strings (non-blocking).

---

## Loop 10 — Full-path audit (new cohort)

### Personas (Cohort R2-J)
| # | Name | Profile | Path exercised |
|---|------|---------|----------------|
| 1 | Asuka Hayashi | JP solo founder | JA → demo → Needs You → Results |
| 2 | Ethan Brooks | EN growth | Share GIF from moment |
| 3 | Mariko Endo | JP marketer | Download GIF + JA caption |
| 4 | Noah Klein | Screen reader | Decide shortcuts + labels |
| 5 | Yui Nakamura | Mobile JA | More → Language → Templates chips |
| 6 | Santiago Ruiz | ESL | Toggle EN, complete decide |
| 7 | Freja Lind | Privacy | JA Privacy/Terms skim |
| 8 | Caleb Stone | Engineer | Agent detail Run details |
| 9 | Hina Okada | Student | Pricing numbers JA |
| 10 | Amir Hassan | Skeptic | Reduced motion still + download |

### Verdict
**Pass — no P0.** JA locale, embeddable media, share, legal, demilitarized agent chrome, and relative time all hold under re-audit.

### Known residual (P2)
- Settings billing / Stripe-adjacent copy partially EN
- Runtime activity log strings authored in English on the server
- OG metadata titles largely EN (body/UI localized)

---

## Cross-cutting inventory of shipping changes

| Area | Key artifacts |
|------|----------------|
| i18n core | `src/i18n/*`, `LocaleToggle`, cookie `conductor_locale` |
| Media | `EmbeddableNeedsYou`, `/public/demo/needs-you.gif`, still + download |
| Decide | `EscalationDecision.tsx`, `useEscalations.ts` |
| Agents | `AgentDetailView.tsx`, `AgentCard.tsx` |
| Share | `ShareButtons.tsx`, `share.*` keys |
| Legal | `src/content/legal.tsx`, privacy/terms pages |
| Locale UX | `formatRelativeTime`, PricingSection, UsageMeters, PublicDemoTour |
| Typography | Noto Sans JP + Montserrat stack |
| Copy | Stop not Abort; Run details; You not Commander |

---

## Recommendation

Ship Round 2 to production after smoke-check:

1. Toggle **JA** on `/` → `/demo` → Needs You → approve  
2. `/demo/moment` GIF + download + reduced motion  
3. `/privacy` and `/terms` render Japanese when cookie is `ja`

Round 3 (optional): localize runtime log strings and remaining Settings/billing chrome; locale-aware OG titles.
