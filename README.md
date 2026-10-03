# ScamShield MY

**Spot the signs. Understand the risk. Stay safe.**

ScamShield MY is an Explainable Scam Risk Assistant that helps Malaysians recognise the warning signs in suspicious messages before they act.

## Problem

Malaysians receive a constant stream of suspicious SMS, WhatsApp messages, and emails: fake bank and account alerts, impersonation of banks and government agencies, suspicious links, OTP and password requests, urgent payment demands, prize scams, and other social engineering. Many people sense that something is wrong but cannot pinpoint which parts of a message are the actual warning signs, which makes it hard to decide what to do.

## Solution

ScamShield MY analyses a pasted message and highlights the common scam risk indicators it contains. It does **not** simply label a message as "scam" or "not scam". Instead, it explains **why** each indicator was detected, shows which phrases triggered it, and recommends practical safety actions, so the user stays in control of the decision.

## Key Features

- Bahasa Melayu and English detection (including mixed-language messages)
- 8 scam risk indicator categories
- Transparent weighted scoring
- LOW / MEDIUM / HIGH risk assessment
- Explainable indicator findings (what, why, and what to do)
- Detected phrase highlighting in the original message
- Recommended safety actions
- Local analysis history (last 20 analyses)
- Responsive, projector-friendly interface

## How Risk Scoring Works

Each detected category contributes a fixed weight. A category contributes its weight only once, even if several of its phrases appear.

| Risk indicator | Weight |
| --- | --- |
| Urgency | +1 |
| Threat / Fear | +2 |
| Suspicious Link | +2 |
| Payment / Money Transfer | +3 |
| OTP / PIN / Password / Sensitive Information | +3 |
| Prize / Reward | +2 |
| Account Suspension / Verification | +2 |
| Impersonation | +2 |

**Thresholds**

- 0 to 2 points: LOW
- 3 to 5 points: MEDIUM
- 6 or more points: HIGH

The score reflects detected risk indicators and is **not proof** that a message is fraudulent.

## Example

Message analysed:

> URGENT! Akaun bank anda akan disekat hari ini. Please verify immediately melalui link berikut: https://example-security-check.com Masukkan OTP anda untuk mengaktifkan semula akaun.

Result:

- **Risk Score: 8**
- **Risk Level: HIGH**
- **4 indicators detected**: Urgency (+1), Suspicious Link (+2), OTP / PIN / Password / Sensitive Information (+3), Account Suspension / Verification (+2)

## Technology

- HTML
- CSS
- Vanilla JavaScript
- localStorage
- Deployable as a static site on Vercel

No framework, build step, or backend is required.

## Privacy

Analysis runs entirely in the browser. The message you paste is never sent to a server. Your analysis history is stored only in your own browser via localStorage, and you can clear it at any time. No backend is required for the MVP. ScamShield MY does not encrypt stored history.

## Built With Kiro

ScamShield MY was built using Kiro across the full development workflow, following a structured path of **Requirements -> Design -> Tasks -> Implementation -> Testing -> Refinement**:

- Requirements specification (EARS-style acceptance criteria)
- Technical design (architecture, data models, correctness properties)
- Implementation task planning (phased task list)
- Phase-based development (foundation, detection engine, explainable results, history)
- Detection rule implementation (the eight-category indicator catalogue)
- Debugging (including a sample-selection cache issue)
- Automated testing and regression testing across phases
- UI refinement and final polish

The Kiro spec documentation lives in `.kiro/specs/scamshield-my/`:

- `requirements.md`
- `design.md`
- `tasks.md`

## Running Locally

This is a static site. Open `index.html` directly in a browser, or serve the folder with any static server (for example `npx serve`).

## Disclaimer

ScamShield MY is a risk-awareness tool, not a definitive scam detection service. A risk score does not prove that a message is fraudulent. Always verify suspicious requests through official channels.
