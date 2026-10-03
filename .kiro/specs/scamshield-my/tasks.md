# Implementation Plan: ScamShield MY

## Overview

This plan builds the ScamShield MY MVP — a static, browser-only, explainable scam risk-awareness assistant (HTML + CSS + vanilla JS + localStorage). It is scoped for a competitive hackathon demo achievable in ~3–4 hours. Work proceeds in five phases: foundation UI, the deterministic detection engine, the explainable results experience, history + polish, and final demo testing.

Each task is small, sequential, and verifiable, and references the specific requirements it fulfils. Tasks are tagged **[MVP]** (essential) or **[POLISH]** (nice-to-have, cut first if time runs short). Test sub-tasks are marked optional with `*`.

## Priority Order If Time Runs Short

Deliver in this absolute order of importance. History may be simplified (even dropped) but message analysis and explainability must never be compromised:

1. Message analysis (input + validation)
2. Detection engine (8 categories)
3. Risk scoring (weights + thresholds)
4. Explainable findings (per-indicator cards + why)
5. Safety recommendations
6. Professional UI
7. Sample messages
8. History (simplify before cutting analysis/explainability)

## Out of Scope (Do NOT Create Tasks For)

Authentication, backend, database, AI/ML/NLP, external or paid APIs, chatbot, admin dashboard, browser extension, native app, advanced analytics, extra pages beyond the MVP single page, heavy documentation, and extensive cross-browser testing. Chrome testing is sufficient for the MVP.

## Tasks

- [ ] 1. Foundation: project shell and analysis UI
  - [ ] 1.1 Create project structure and link assets **[MVP]**
    - Create `index.html`, `css/style.css`, `js/rules.js`, `js/app.js` (empty stubs are fine)
    - Load `rules.js` before `app.js` via plain `<script>` tags (no bundler)
    - Add semantic landmarks: `header`, `nav`, `main`
    - _Requirements: 8.1, 8.3_

  - [ ] 1.2 Build the navigation header and hero **[MVP]**
    - Header: shield mark, product name "ScamShield MY", subtitle "Explainable Scam Risk Assistant", nav links Analyse / History / About
    - Hero: headline "Think Before You Trust." plus supporting description framing the tool as highlighting possible warning signs (not a verdict)
    - _Requirements: 9, 10.1, 10.3 (design: UI Component Structure)_

  - [ ] 1.3 Build the main analysis interface **[MVP]**
    - Labelled message `textarea`, live character counter (`n / 5000`)
    - Primary CTA "Analyse Message", "Clear" control, "Sample Message" control
    - Mark up (empty for now) regions for summary, finding cards, recommendations, highlighted copy, and the disclaimer
    - _Requirements: 1.1, 1.2, 7.4_

  - [ ] 1.4 Establish the cybersecurity visual system **[MVP]**
    - Dark navy / deep blue brand surfaces, light content surfaces/cards, blue/cyan accent for primary action + focus
    - Risk colour tokens: green = LOW, amber = MEDIUM, red = HIGH (status only)
    - Clean sans-serif typography and a base responsive single-column layout; no flashing/startle styling
    - _Requirements: 9.4, 9.5 (design: Visual Identity)_

  - [ ] 1.5 Checkpoint — verify the shell renders **[MVP]**
    - Open `index.html` in Chrome; confirm header, hero, textarea, counter, and all buttons render with the theme and no console errors before continuing

- [ ] 2. Core detection engine
  - [ ] 2.1 Build the rule catalogue in `rules.js` **[MVP]**
    - Define `SCAM_INDICATORS` with all 8 categories and EXACT weights: urgency 1; threat/fear 2; suspicious link 2; payment/transfer 3; OTP/PIN/password/sensitive 3; prize/reward 2; account suspension/verification 2; impersonation 2
    - Each entry: `id`, `name`, `weight`, `severity`, `keywords` (English AND Bahasa Melayu), `patterns` (URL/risky-TLD regex for suspicious link), `explanation`, `recommendedAction`
    - _Requirements: 2.2, 3.1 (design: Indicator Rule Structure)_

  - [ ] 2.2 Implement input validation and text normalization in `js/app.js` **[MVP]**
    - Reject empty/whitespace-only (prompt, no analysis); reject >5000 chars (message shown, text retained, no analysis)
    - Normalize a lowercased + whitespace-collapsed copy for matching; preserve the original message unmutated
    - On analysis, cap to first 5000 chars and set a `truncated` flag when needed
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.4, 2.8_

  - [ ] 2.3 Implement indicator detection **[MVP]**
    - Iterate `SCAM_INDICATORS`; case-insensitive keyword + regex matching against normalized text
    - Record distinct matched phrases per category; report each matched category exactly once; return zero indicators when nothing matches
    - _Requirements: 2.1, 2.3, 2.5, 2.6, 2.7_

  - [ ] 2.4 Implement weighted scoring and risk-level mapping **[MVP]**
    - Risk Score = sum of DISTINCT detected category weights (duplicate category counts once)
    - Map thresholds: 0–2 LOW, 3–5 MEDIUM, 6+ HIGH; assign exactly one level; deterministic on repeat
    - No probability percentages, no AI
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.11_

  - [ ]* 2.5 Write property test — scoring is sum of distinct category weights **[MVP]**
    - **Property 1: Scoring is the sum of distinct detected category weights**
    - **Validates: Requirements 2.3, 3.1, 3.2**
    - Lightweight in-browser/console assertions (no framework), min 100 generated inputs

  - [ ]* 2.6 Write property test — duplicate match does not change score **[MVP]**
    - **Property 2: Duplicate matches of a category do not change the score**
    - **Validates: Requirements 3.3**

  - [ ]* 2.7 Write property test — score→level mapping is total and single-valued **[MVP]**
    - **Property 3: Score-to-level mapping is total and single-valued**
    - **Validates: Requirements 3.4, 3.5, 3.6, 3.7**

  - [ ]* 2.8 Write unit tests — all 8 categories + BM/English/mixed + critical scenario **[MVP]**
    - One representative message per category; BM, English, and mixed-language detection; threshold boundaries
    - Critical scenario: urgency(+1) + account suspension(+2) + suspicious link(+2) + OTP(+3) = score 8 → HIGH
    - _Requirements: 1.6, 2.2, 2.4, 3.1–3.6_

- [ ] 3. Checkpoint — detection engine correct
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Explainable security experience
  - [ ] 4.1 Build the threat-assessment summary **[MVP]**
    - Render Risk Level (text label + icon, not colour alone), Risk Score, Indicators Detected count, and a risk meter reflecting the LOW/MEDIUM/HIGH band
    - Show the "score reflects presence of risk indicators and is not proof of a scam" text; NO fake probability %
    - _Requirements: 3.9, 3.10, 4.1, 4.2_

  - [ ] 4.2 Render one security finding card per detected indicator **[MVP]**
    - Each card: category name, detected phrase(s), points contributed, why-it-matters explanation, recommended action
    - Handle zero-phrase indicators (show explanation, no phrase list) and the zero-indicator result (no common indicators found + stay-cautious/verify advice)
    - Use qualifying "possible risk / possible warning sign" wording; never a binary verdict
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 10.5_

  - [ ] 4.3 Implement injection-safe suspicious-phrase highlighting **[MVP]**
    - Build a highlighted copy from the ORIGINAL message; HTML-escape every segment; wrap matched spans (merge overlaps) without inserting pasted content as raw HTML
    - Never mutate the original message
    - _Requirements: 2.5 (design: Message Highlighting, security)_

  - [ ]* 4.4 Write property tests — original preserved + highlighting injection-safe **[MVP]**
    - **Property 7: Original input is never mutated** — **Validates: Requirements 2.5, 4.3**
    - **Property 8: Highlighted copy is injection-safe** — **Validates: Requirements 2.5**

  - [ ] 4.5 Implement safety recommendation generation **[MVP]**
    - Map each detected category to its recommended action; deduplicate; cap at number of detected categories
    - Category-specific guarantees: OTP → don't share OTP/PIN/password; link → don't click; payment → don't transfer
    - Always include verify-through-independently-obtained-official-channel when ≥1 indicator; handle zero-indicator case
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 4.6 Write property test — recommendations mapped, unique, bounded **[MVP]**
    - **Property 9: Recommendations are mapped, unique, and bounded**
    - **Validates: Requirements 5.1, 5.2, 5.6**

  - [ ] 4.7 Add the visible risk-awareness disclaimer **[MVP]**
    - Display the disclaimer (risk-awareness tool, not definitive detection) and keep it visible within the results view
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ] 4.8 Add sample messages with one-click load **[MVP]**
    - At least one each LOW / MEDIUM / HIGH spanning BM, English, and mixed-language, collectively covering ≥3 categories
    - One click replaces textarea content; loaded text behaves as normal input
    - Include the HIGH-risk mixed sample (urgency + suspension + link + OTP → 8 → HIGH) as the strong demo moment
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 5. Checkpoint — explainable results end to end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. History and final polish
  - [ ] 6.1 Implement analysis history via localStorage **[MVP]**
    - Key `scamshield_history_v1`; store id, timestamp, message preview, original message, risk score, risk level, detected category count/categories
    - Max 20 records, newest-first display, oldest-eviction; view record details; Clear History control
    - Graceful handling of unavailable/corrupted/quota-exceeded storage (never block showing results)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 6.2 Write property test — history capped and ordered **[MVP]**
    - **Property 10: History is capped and ordered**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [ ] 6.3 Responsive refinement for desktop/projector, tablet, mobile **[POLISH]**
    - Verify no horizontal scroll from 320 px up; large touch targets; input + CTA always visible; desktop dashboard composition for projector
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 6.4 Add states, feedback, and accessibility **[POLISH]**
    - Empty states, an "Analysing…" state, subtle interaction feedback; visible high-contrast focus states
    - Risk level conveyed by text + icon (not colour alone); polite live region for results; no flashing/startle
    - _Requirements: 4.2, 9.4, 9.5 (design: Accessibility, Micro-interactions)_

- [ ] 7. Final testing and demo
  - [ ]* 7.1 Manual end-to-end test checklist (Chrome) **[MVP]**
    - Empty-message validation; character limit; all 8 categories; BM / English / mixed; LOW/MEDIUM/HIGH
    - Duplicate-category scoring prevention; score accuracy; highlighting; recommendations; sample messages
    - localStorage history; clear history; browser-refresh persistence; responsive layout; no console errors; full demo workflow
    - _Requirements: 1.4, 1.5, 2.2, 2.3, 2.4, 3.1–3.6, 4, 5, 6, 7, 9_

  - [ ]* 7.2 Critical demo test **[MVP]**
    - Analyse exactly: `URGENT! Akaun bank anda akan disekat hari ini. Please verify immediately melalui link berikut: https://example-security-check.com Masukkan OTP anda untuk mengaktifkan semula akaun.`
    - Expect: Urgency +1, Account Suspension/Verification +2, Suspicious Link +2, OTP/Sensitive +3 → Risk Score = 8 → HIGH, with every contributing indicator visible and explained
    - _Requirements: 3.1–3.6, 3.9, 4.1–4.5_

## Notes

- Tasks marked `*` are optional test sub-tasks and may be skipped for a faster MVP.
- Tags: **[MVP]** = essential for the demo; **[POLISH]** = cut first if time runs short.
- Each task references specific requirements for traceability.
- Property test sub-tasks use lightweight in-browser/console assertions (no framework) and reference the design's Correctness Properties.
- If time runs short, simplify or drop History (task 6.1) before compromising analysis or explainability.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4"] },
    { "id": 5, "tasks": ["2.5", "2.6", "2.7", "2.8"] },
    { "id": 6, "tasks": ["4.1", "4.2", "4.3", "4.5", "4.7", "4.8"] },
    { "id": 7, "tasks": ["4.4", "4.6"] },
    { "id": 8, "tasks": ["6.1"] },
    { "id": 9, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 10, "tasks": ["7.1", "7.2"] }
  ]
}
```
