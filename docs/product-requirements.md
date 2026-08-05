# PM Reps MVP Product Requirements

## Document status

- Status: Step 1 approved by the user
- Product phase: Step 1 — product definition
- Last updated: 2026-08-04
- Implementation status: End-to-end private MVP implemented and verified
- Next-step gate: Step 2 approval required before implementation scaffolding

## 1. Product vision

PM Reps helps an aspiring AI product manager build judgment through repeated decisions about real AI products.

It converts verified product announcements into short exercises. The learner sees a product context, evidence, and constraints; commits to a decision; receives evidence-linked feedback; revises the decision; and optionally publishes the reasoning as a Decision Card.

The product is not designed to teach a memorized interview framework. It is designed to make product judgment observable and improvable over time.

## 2. Problem

Reading AI news creates awareness but does not require the reader to make a product decision. Generic mock-interview tools create practice volume but often rely on fictional prompts, framework-shaped answers, and opaque AI scores.

The primary user already receives a verified daily AI HOT report. The missing layer is active practice:

- deciding before learning what the company shipped;
- reasoning from incomplete evidence and explicit constraints;
- evaluating product, model, measurement, and rollout trade-offs;
- revising after feedback; and
- preserving the reasoning trail as career evidence.

## 3. Primary user

The MVP is built first for an analytically trained professional transitioning toward AI product management. The learner already follows AI product news and wants practical judgment training with portfolio-ready evidence.

The later secondary audience is analytics, engineering, or research professionals transitioning into AI product roles.

## 4. Job to be done

When I read about a new AI product launch, help me practice making the underlying product decision before I see what the company did, so I can improve my judgment and demonstrate how I reason rather than merely summarize news.

## 5. Experience promise

A useful daily rep should take approximately 8–10 minutes and leave the learner with:

1. one committed product decision;
2. evidence-linked feedback;
3. one meaningful revision; and
4. a saved reasoning trail.

## 6. Product principles

### 6.1 Commitment before reveal

The company identity, source link, and real launch outcome remain hidden until the learner commits to the requested decision.

### 6.2 Reasoning over agreement

The learner must not be penalized merely for choosing a different option from the company. Feedback evaluates the connection among evidence, assumptions, user value, metrics, AI constraints, and rollout risk.

### 6.3 Evidence before authority

Every factual feedback claim must point to evidence in the case pack or original source. Inference must be labeled as inference.

### 6.4 Revision creates learning

A completed rep requires a post-feedback revision or an explicit explanation of why the original decision remains unchanged.

### 6.5 Patterns, not fake precision

The Skill Map reports recurring strengths and gaps. It must not present an unsupported universal PM score.

### 6.6 Private by default

Raw answers, incomplete reps, and Skill Map history remain private. Public Decision Cards require deliberate publication.

## 7. Core flow

### Step A — Open Today's Rep

The learner sees one case, an estimated duration, the decision type, and the available evidence.

### Step B — Work through the decision

The case asks four short questions selected from:

- target user and problem;
- product priority or MVP;
- primary metric and guardrail;
- AI evaluation or failure mode;
- rollout scope and stop condition.

The first MVP uses structured choices plus a required free-text rationale. It does not require voice input.

### Step C — Commit

The learner locks the decision. Answers become immutable as the original attempt and the source is unlocked.

### Step D — Review evidence feedback

The learner sees rubric feedback, cited evidence, the real launch decision, and clearly labeled inference. The feedback explains trade-offs rather than presenting a single model answer.

### Step E — Revise

The learner submits a revised answer or explicitly keeps the original with additional justification.

### Step F — Save or publish

The completed rep updates the private Skill Map. The learner may separately create and publish a Decision Card.

## 8. Information architecture

### 8.1 Today's Rep

- Current case
- Progress through the four decision prompts
- Known facts and constraints
- Locked-source state
- Commit action

### 8.2 Feedback

- Original response
- Rubric feedback by dimension
- Evidence citations
- Real product outcome
- Revision prompt
- Revised response

### 8.3 Skill Map

- Completed rep history
- Repeated strengths
- Repeated gaps
- Suggested next practice dimension
- No universal score or public leaderboard

### 8.4 Public Proof

- Published Decision Card index
- Original decision
- Reasoning and assumptions
- Evidence used
- What changed after feedback
- Source links
- Publication and unpublication controls

## 9. MVP functional requirements

### FR-1: Case availability

The product must present one active case at a time. The initial implementation may use a fixed, manually authored case before real AI HOT ingestion is added.

### FR-2: Case structure

Each case must contain:

- a stable case ID;
- title and decision type;
- estimated duration;
- scenario;
- known facts;
- constraints;
- four prompts;
- source metadata;
- real outcome;
- feedback rubric; and
- publication eligibility.

### FR-3: Leakage control

Before commitment, the user interface and client-visible case payload must not expose the company identity, source URL, source title, real outcome, or reference reasoning.

### FR-4: Original attempt

The product must preserve the committed original response and commitment time. Later revisions must not overwrite it.

### FR-5: Evidence-linked feedback

Feedback must associate each factual observation with one or more case evidence IDs. Unsupported factual claims must be rejected or labeled unavailable.

### FR-6: Revision

The learner must be able to revise each decision prompt after feedback. The product must show the original and revised versions together.

### FR-7: Skill Map update

Only completed reps may update private skill patterns. Abandoned or partially completed reps must not be treated as evidence of ability.

### FR-8: Decision Card publication

Publishing must be a separate explicit action. A public card must exclude private notes, unrelated history, and unpublished responses.

### FR-9: Source provenance

Every published card must retain the original product source title, canonical link, publication date, and retrieval date.

### FR-10: Responsive interaction

The core decision and feedback flows must work at phone and desktop widths with keyboard-accessible controls and no horizontal clipping.

## 10. Feedback rubric

The MVP evaluates five dimensions:

1. **User and problem linkage** — Does the decision clearly connect to a specific user and need?
2. **Evidence use** — Does the rationale use available facts and distinguish assumptions?
3. **Metric validity** — Do the primary metric and guardrails represent user value without obvious gaming?
4. **AI system awareness** — Does the reasoning address model quality, uncertainty, latency, cost, safety, or another relevant AI constraint?
5. **Rollout judgment** — Does the learner define scope, reversibility, monitoring, and stop conditions where relevant?

Each dimension returns:

- `strong`, `supported`, `partial`, or `missing`;
- a concise rationale;
- cited evidence IDs;
- one improvement prompt; and
- evaluator confidence.

The interface must not collapse these dimensions into a single public score.

## 11. AI behavior requirements

- The case generator must use only the supplied source material for factual claims.
- The evaluator must not treat the real company decision as the answer key.
- Feedback must separate fact, interpretation, and suggestion.
- The evaluator must say `insufficient evidence` when the case pack cannot support a claim.
- The evaluator must avoid rewarding terminology without reasoning.
- Equivalent reasoning expressed in Chinese or English should receive materially consistent feedback.
- Model output must conform to a versioned structured schema before display or storage.
- A failed or invalid evaluation must not update the Skill Map.

## 12. Initial product assumptions

- English is the default interface language for portfolio use.
- The learner may answer in English or Chinese.
- The MVP is single-user and private by default.
- One active rep is sufficient; no infinite news feed is required.
- The first implemented case is fixed and manually verified.
- AI HOT integration follows only after the fixed-case flow is usable and testable.
- Public Decision Cards are readable without an account.

## 13. Success metrics

### North-star behavior

Completed and revised decision reps per active week.

### Product metrics

- Rep start-to-completion rate
- Median completion time
- Revision rate after feedback
- Weekly returning learner rate
- Decision Card publication rate
- User-reported feedback disagreement rate

### AI quality metrics

- Factual feedback citation coverage
- Unsupported factual claim rate
- Evaluation schema-validity rate
- Repeated-evaluation consistency
- Chinese-versus-English semantic consistency
- Answer-key leakage rate before commitment
- Human disagreement rate by rubric dimension

No target values will be invented before baseline dogfooding data exists.

## 14. Privacy and trust

- Practice history is private by default.
- Publication is explicit and reversible.
- Original and revised answers are distinguishable.
- Source text is treated as untrusted input and cannot change system behavior.
- The product stores only the minimum source excerpt required for the case and preserves the canonical link.
- Secrets and private AI HOT runtime data must never appear in a case or public card.

## 15. Accessibility and language

- All core actions must be keyboard accessible.
- Controls must use visible labels and native semantics.
- Progress cannot rely on color alone.
- The interface must remain usable at 320 px width.
- Source material may be Chinese or English; interface copy remains English in the MVP.
- The evaluator must preserve the learner's response language unless the learner asks for translation.

## 16. Non-goals for the MVP

- Generic PM interview simulation
- Voice interviewing
- Social feed, comments, or leaderboard
- Course library or framework encyclopedia
- Resume or cover-letter generation
- Automatic job matching
- Team workspaces
- Payments
- Native mobile application
- Multiple model-provider comparison
- Fully autonomous publishing

## 17. MVP acceptance criteria

The MVP is acceptable only when all of the following are demonstrated:

1. A learner can complete one four-prompt case on desktop and phone widths.
2. The company, source, and real outcome are absent from the pre-commit client payload.
3. Committing preserves an immutable original attempt.
4. Feedback returns all five rubric dimensions in the defined schema.
5. Every factual feedback statement contains a valid case evidence citation or is labeled insufficient evidence.
6. A different but defensible decision is not automatically marked incorrect.
7. The learner can submit a revision and compare it with the original.
8. Only a completed and valid rep updates the private Skill Map.
9. A learner can preview, publish, and unpublish one public Decision Card.
10. The published card contains provenance but no private notes or hidden case data.
11. Invalid model output fails closed and does not create progress or public content.
12. A small manually reviewed evaluation set covers leakage, unsupported claims, evaluator consistency, bilingual answers, and alternative valid decisions.

## 18. Stage gates after this document

Development proceeds only through explicit approval gates:

1. **Step 1:** Product definition package — this document and README.
2. **Step 2:** Technical architecture, versioned data contracts, threat boundaries, and AI evaluation plan.
3. **Step 3:** Web application scaffold and static application shell.
4. **Step 4:** Fixed-case Today's Rep flow with no model or AI HOT dependency.
5. **Step 5:** Feedback, revision, Skill Map, and Public Proof behavior.
6. **Step 6:** Verified AI HOT ingestion and model-backed case generation/evaluation.
7. **Step 7:** End-to-end evaluation, responsive polish, deployment, and portfolio handoff.

The user lifted the remaining approval gates after Step 4 on 2026-08-04 and authorized completion of Steps 5 through 7 in one pass.

## 19. Step 1 approval decision

Approval of this document confirms the product problem, target user, core flow, MVP scope, product principles, and acceptance criteria. It does not authorize any later step automatically.
