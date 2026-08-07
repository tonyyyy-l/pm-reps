# PM Reps Product Requirements

## Document status

- Version: Product refinement v2
- Status: Product decisions approved by the user
- Last updated: 2026-08-07
- Product phase: Private dogfood refinement
- Implementation status: The current MVP implements part of this document; the remaining v2 requirements are not yet implemented
- Approval source: Product grilling session completed on 2026-08-07

## 1. Product vision

PM Reps helps an aspiring AI product manager improve judgment through deliberate practice on real AI product decisions.

It converts selected AI product announcements into short, evidence-grounded exercises. The learner makes a decision without seeing the company identity or shipped choice, receives contestable evidence-linked feedback, revises the reasoning, and builds a private record of first-pass judgment and learning progress. Selected completed work may become a public Decision Card.

PM Reps is not a news reader, a generic interview simulator, or a system for memorizing product frameworks. Its primary purpose is to make product judgment observable and improve it through repeated, targeted practice.

## 2. Problem

Reading AI news creates awareness but does not require an independent product decision. Generic mock-interview tools often use fictional prompts, obvious multiple-choice answers, framework-shaped responses, and opaque scores.

The learner needs a practice system that:

- turns real product material into a decision that must be made before reveal;
- targets recurring judgment gaps instead of serving only random novelty;
- presents several defensible choices with real trade-offs;
- separates source facts, company-reported claims, and inference;
- evaluates the original judgment and the response to feedback separately;
- allows the learner to challenge questionable feedback; and
- stays lightweight enough for regular use.

## 3. Primary user

The first user is an analytically trained professional transitioning into AI product management. The learner already follows AI product news, wants to build practical judgment, and values portfolio-ready evidence without exposing private practice history.

Later users may include analytics, engineering, and research professionals moving toward AI product roles.

## 4. Job to be done

When I want to improve my AI product judgment, give me a short decision exercise based on a real product situation that targets a skill I need to strengthen, lets me commit before seeing what the company shipped, and shows whether both my first-pass reasoning and my revision are improving.

## 5. Experience promise

A useful rep should take approximately 5–10 minutes and leave the learner with:

1. one independent first-pass product judgment;
2. evidence-linked and contestable feedback;
3. one meaningful revision or a stronger defense of the original choice;
4. a comparison with what the company actually chose or shipped; and
5. an updated private learning record.

## 6. Product principles

### 6.1 Deliberate practice over novelty

The default exercise should address a skill that needs practice. Randomness supplies variety inside the relevant practice pool; it must not replace curriculum logic. A separate `Surprise me` action may provide unrestricted random selection.

### 6.2 Commitment before reveal

The company identity, product identity, source link, and shipped choice remain hidden until the learner commits. The product must not present a company decision as a correct answer.

### 6.3 Reasoning over agreement

Different decisions can be valid. Feedback evaluates how the learner connects users, evidence, assumptions, metrics, AI-system constraints, and rollout risk.

### 6.4 Evidence with provenance

Every factual claim must cite the case evidence or original source. The interface and evaluator must distinguish observable release facts, company-reported claims, and inference.

### 6.5 Revision creates learning

A revision must be evaluated, not merely collected. The system preserves the original judgment, measures the response to feedback separately, and never rewrites history.

### 6.6 Feedback is contestable

Model feedback is not authoritative. The learner may dispute a specific dimension without discarding the rest of the exercise.

### 6.7 Patterns, not fake precision

The Skill Map shows recurring evidence and trends. It must not present a universal PM score or infer mastery from one exercise.

### 6.8 Private by default

Raw answers, disputes, incomplete attempts, calibration results, and Skill Map history remain private. Publication is explicit and reversible.

### 6.9 Scope restraint

PM Reps compares the learner's decision with what the company chose or shipped. It does not monitor post-launch market performance, schedule future outcome checks, or require another assistant to maintain historical product results.

## 7. Judgment framework

PM Reps evaluates five product-judgment dimensions:

1. **User and problem linkage** — connecting a decision to a specific user, need, and workflow moment.
2. **Evidence use** — distinguishing source evidence, company claims, assumptions, and inference.
3. **Metric validity** — choosing metrics and guardrails that represent user value without obvious gaming.
4. **AI system awareness** — accounting for model quality, uncertainty, latency, cost, permissions, privacy, safety, and failure behavior.
5. **Rollout judgment** — defining scope, reversibility, monitoring, stop conditions, and expansion logic.

The system records two separate learning signals:

- **First-pass judgment:** what the learner identifies and decides before receiving feedback.
- **Revision response:** how effectively the learner responds to feedback or strengthens a defensible original position.

First-pass judgment drives future practice targeting. Revision response measures learning behavior and must not erase the original signal.

## 8. Calibration and adaptive practice

### 8.1 Five-rep calibration

The first five completed reps form a balanced calibration period. They should cover varied products, decision dimensions, and at least the `Structured` and `Trade-off` difficulty levels.

During calibration:

- the Skill Map labels all patterns as early signals;
- one weak result cannot control future selection;
- practice selection remains balanced rather than personalized; and
- disputed or low-confidence observations do not establish a weakness.

### 8.2 Target-first selection

After calibration, each default rep begins by selecting one core training dimension. The system then:

1. identifies a repeated first-pass gap using recent, non-disputed, sufficiently confident evidence;
2. filters the local pool to products that can support that dimension;
3. randomly claims one unseen product from the filtered set;
4. requires the generated case to include a core question for that dimension; and
5. verifies that the question actually exercises the target skill.

The remaining questions may cover adjacent dimensions when the evidence supports them.

### 8.3 Difficulty progression

Difficulty is represented through three lightweight levels:

- **Structured:** evidence is relatively complete; options are plausible but the trade-off is legible.
- **Trade-off:** evidence conflicts and every choice sacrifices something important.
- **Ambiguous:** important information is missing; the learner must state assumptions, request evidence, or define a stop condition.

Difficulty changes gradually based on repeated first-pass performance. Results from different difficulty levels must remain distinguishable in the Skill Map rather than being averaged as equivalent observations.

## 9. Candidate pool

### 9.1 Source policy

PM Reps reads only fully paginated AI HOT selected `ai-products` items from the anonymous read-only API. It must not supplement the pool with all-products mode, external news search, or model memory.

### 9.2 Practice-fit gate

Not every selected product belongs in PM Reps. A candidate must provide enough material for a genuine product decision and support at least two judgment dimensions. Pure financing, stock, earnings, research-paper, benchmark, parameter-count, training-method, and minor-maintenance items are excluded unless they contain meaningful product trade-offs.

The current deterministic entry gate requires:

- a valid publication time;
- a sufficiently detailed summary;
- at least two supported judgment dimensions; and
- a practice-fit score of at least 75.

Semantic source isolation and case review provide later gates before activation.

### 9.3 Durable private storage

Eligible products are stored in an owner-scoped D1 practice pool before generation. Repeated syncs may refresh metadata but must not reset lifecycle state. Completed and recognized products never return to the unseen queue.

### 9.4 Identity protection

Uncompleted candidates must not reveal product titles, company names, summaries, or source links in Case Inbox. Before completion, Case Inbox may show only:

- unseen count;
- judgment-dimension coverage;
- difficulty availability;
- last sync time; and
- anonymous candidate labels.

Full product identity and source links become visible only after completion.

### 9.5 Recognized products

Every active exercise includes `I recognize this launch`. Using it:

- ends the attempt without penalty;
- creates no Skill Map observation;
- marks the product `seen` so it is not selected again; and
- automatically requests another eligible product.

No explanation is required.

### 9.6 Source preflight and automatic replacement

Original-source readability is checked before a candidate is presented as ready. If generation or review still fails, the system automatically tries another eligible unseen product. One start request may attempt at most three candidates. Only after three failures does the interface show a concise stage-level error.

Failed candidates do not affect learner history, and internal prompts, credentials, and sensitive error details never appear in the response.

## 10. Blind case construction

The generation pipeline must prevent the case generator from seeing what the company ultimately chose or shipped.

The pipeline uses one private DeepSeek integration and distinct isolated model operations:

1. **Evidence isolation:** read the original source and separate decision-time evidence from company identity, shipped choice, and reveal-only material.
2. **Blind case generation:** provide only the decision-time evidence, target dimension, and difficulty level to the case generator.
3. **Separate reviewer pass:** review the original source, isolated evidence, generated case, option quality, target coverage, provenance labels, and leakage.
4. **Deterministic gates:** verify schemas, exact source quotations, evidence IDs, option count, prohibited reveal terms, target-dimension presence, and reviewer consistency.

All model operations use the same server-only `DEEPSEEK_API_KEY`. The product must describe this as a `separate reviewer pass`, not an independent model or cross-provider review. Missing credentials or any failed gate leave the current active case unchanged.

## 11. Evidence model

Each evidence item has one provenance label:

- **Shipped fact:** an observable release detail such as feature availability, price, platform, rollout scope, or stated product behavior.
- **Company-reported:** a performance, accuracy, efficiency, adoption, or benefit claim reported by the company or publisher but not independently verified.
- **Inference:** an explicit interpretation derived from the supplied material.

Company-reported claims must be phrased as claims, for example `The company reports...`, rather than converted into unqualified facts. The reviewer rejects unsupported upgrades from `Company-reported` or `Inference` to `Shipped fact`.

Any `Shipped fact` or `Company-reported` item that exposes the company's final choice is reveal-only. The pre-commit evidence pack may use these labels only for prior-state or decision-time context that does not disclose what was ultimately launched.

## 12. Question design

### 12.1 Variable case depth

A case contains two to four questions depending on evidence depth. It must not generate extra questions merely to reach a fixed count.

Every case contains:

- one core question for the target dimension; and
- one to three supporting questions only when the evidence supports meaningful additional decisions.

### 12.2 Core question interaction

For the core question, the learner first writes one concise initial direction before seeing options. The interface then reveals three plausible options. The learner may confirm or change the initial direction and must explain the accepted trade-off.

This sequence prevents the options from doing the learner's first-pass thinking.

### 12.3 Option quality

Every option must:

- be a choice a reasonable PM could make;
- optimize a different objective or accept a different trade-off;
- satisfy the basic case constraints;
- be mutually distinguishable without being artificially extreme;
- avoid wording, length, tone, or copied source language that signals a preferred answer; and
- remain defensible under an explicit assumption.

No option may dominate all others. The learner's rationale must state what is being sacrificed and why the second-best alternative was rejected. The reviewer rejects any question with an obvious answer or a non-credible distractor.

Supporting questions may use the same three-option structure without the initial free-response step.

## 13. Core experience flow

### Step A — Choose the practice objective

During calibration, the system chooses a balanced objective. After calibration, it defaults to a repeated first-pass gap. The learner may instead choose `Surprise me`.

### Step B — Claim an anonymous case

The system randomly selects an unseen, practice-fit product that supports the objective and difficulty. Product identity remains hidden. Source or generation failure triggers bounded automatic replacement.

### Step C — Decide

The learner reads the scenario, evidence, provenance labels, and constraints. The case presents two to four questions. The core question collects an independent initial direction before showing three credible alternatives.

### Step D — Commit

The learner commits all answers and rationales. The original response becomes immutable.

### Step E — Receive feedback

Feedback evaluates the first-pass judgment across all five dimensions, cites evidence, shows confidence, and remains separate from the company's shipped choice.

### Step F — Dispute if needed

The learner may mark a specific dimension `I disagree`, add an optional short reason, and continue the exercise. A disputed observation is excluded from Skill Map routing until it is reviewed or superseded by later evidence.

### Step G — Revise and re-evaluate

The learner revises the reasoning or explicitly retains the original with stronger justification. The revision receives a separate evaluation. Completion does not require a higher rating, but it does require a meaningful response to the feedback.

### Step H — Compare with what shipped

The reveal shows:

1. `Your decision`;
2. `What the company chose or shipped`; and
3. `Comparison`, focused on differences, similarities, assumptions, and trade-offs.

The reveal explicitly states that the company choice is not the answer key. It does not claim to show market success or later product performance.

### Step I — Save or publish

The completed rep updates the private Skill Map with separate first-pass and revision-response observations. The learner may separately create and publish a Decision Card.

## 14. Feedback and Skill Map

Each evaluation dimension returns:

- `strong`, `supported`, `partial`, or `missing`;
- a concise rationale;
- cited evidence IDs;
- one improvement prompt; and
- `low`, `medium`, or `high` confidence.

The Skill Map must account for:

- calibration status and sample count;
- first-pass performance;
- revision-response performance;
- recency;
- evaluator confidence;
- case difficulty;
- disputed observations; and
- repeated patterns across products.

The Skill Map must not:

- personalize from one observation;
- treat low-confidence or disputed feedback as a confirmed weakness;
- collapse first-pass and revised results into one average;
- compare different difficulty levels as equivalent; or
- present a universal PM score.

## 15. Information architecture

### 15.1 Today's Rep

- Practice objective
- Difficulty label
- Anonymous case brief
- Evidence provenance
- Two to four questions
- Initial direction for the core question
- `I recognize this launch`
- Commit action

### 15.2 Feedback

- Locked original response
- First-pass evaluation and confidence
- Dimension-level dispute action
- Revision workspace
- Revised evaluation
- Before-and-after reasoning comparison
- What the company chose or shipped

### 15.3 Case Inbox

- Anonymous unseen-pool count
- Skill coverage
- Difficulty coverage
- Sync and availability status
- `Start targeted rep`
- `Surprise me`
- Completed product history with full identity and sources

### 15.4 Skill Map

- Calibration progress
- First-pass judgment patterns
- Revision-response patterns
- Difficulty context
- Repeated strengths and gaps
- Next recommended practice dimension

### 15.5 Public Proof

- Selected completed Decision Cards
- Original decision and assumptions
- Evidence used
- Feedback and revision
- What the company chose or shipped
- Explicit publication and unpublication controls

## 16. Functional requirements

### FR-1: Calibration

The first five completed reps must remain a balanced calibration set. The product must not claim a stable weakness or enable adaptive routing before calibration completes.

### FR-2: Target-first practice

After calibration, the default rep must begin with a target judgment dimension derived from repeated first-pass evidence. Random selection occurs only inside the eligible target pool.

### FR-3: Selected-only source pool

Only AI HOT selected `ai-products` items that pass the practice-fit and source-readability gates may enter the unseen pool.

### FR-4: Candidate anonymity and recognition

Uncompleted product identity must stay hidden. A recognized product can be skipped without penalty and must not return to the unseen pool.

### FR-5: Variable question count

Each case contains two to four evidence-supported questions, including one core target-dimension question.

### FR-6: Non-obvious choices

The core question must collect an initial direction before showing three credible, non-dominated options. Every choice question must pass the option-quality review.

### FR-7: Blind generation

The case generator must receive decision-time evidence without company identity or shipped-choice material.

### FR-8: Evidence provenance

Every evidence item must be labeled `Shipped fact`, `Company-reported`, or `Inference`, and every factual feedback statement must cite a valid evidence item.

### FR-9: Immutable commitment

The committed first-pass response and commitment time are immutable. Revisions and disputes are separate records.

### FR-10: Reveal comparison

The reveal compares the learner's decision with what the company chose or shipped and explicitly rejects answer-key framing. Post-launch market performance is outside scope.

### FR-11: Revision re-evaluation

The revised response must receive a separate evaluation. Original and revised results remain visible and separately queryable.

### FR-12: Dimension-level disputes

The learner may dispute one evaluation dimension without invalidating the rest of the attempt. Disputed evidence is excluded from adaptive routing.

### FR-13: Dual-signal Skill Map

The Skill Map separately reports first-pass judgment and revision response, with sample count, recency, confidence, difficulty, and dispute state.

### FR-14: Adaptive difficulty

Cases use `Structured`, `Trade-off`, or `Ambiguous` difficulty. Difficulty changes only after repeated evidence and remains visible in progress interpretation.

### FR-15: Bounded automatic replacement

A start request may preflight and attempt at most three candidates. Candidate failures do not create learner progress or expose sensitive diagnostics.

### FR-16: Publication

Publishing is a separate, explicit, reversible action available only for completed attempts. Public projections exclude private notes, disputes, unrelated history, and unpublished responses.

### FR-17: Responsive and bilingual use

The core decision and feedback flows must work at 320-pixel width and desktop widths, remain keyboard accessible, and accept Chinese or English reasoning without changing rubric meaning.

## 17. Success metrics

### North-star behavior

Completed targeted reps with a valid first-pass and revision pair per active week.

### Learning metrics

- Five-rep calibration completion rate
- Repeated first-pass gap frequency by dimension
- Revision-response improvement frequency
- Performance by difficulty level
- Time until a repeated gap becomes stable
- Rate of disputed observations later confirmed or superseded

### Product metrics

- Rep start-to-completion rate
- Median completion time
- Recognized-launch replacement rate
- Automatic candidate replacement rate
- Weekly returning learner rate
- Targeted-rep versus `Surprise me` usage
- Decision Card publication rate

### AI quality metrics

- Case activation pass rate by failure stage
- Source-quotation coverage
- Unsupported claim rate
- Provenance-label error rate
- Obvious or dominated option rejection rate
- Target-dimension coverage rate
- Pre-commit identity or shipped-choice leakage rate
- Evaluation schema-validity rate
- Repeated-evaluation consistency
- Chinese-versus-English semantic consistency
- User-reported disagreement rate by dimension

No target values will be invented before dogfood data establishes a baseline.

## 18. Privacy and trust

- Practice history, calibration, disputes, and Skill Map data are private by default.
- Publication is explicit and reversible.
- Public slugs and cards must not expose stable user IDs, email addresses, credentials, or private history.
- Source text and AI HOT content are untrusted data and cannot change system instructions.
- Only minimum evidence excerpts and provenance required for a case are stored.
- DeepSeek credentials remain server-side and must never enter source control, client payloads, logs, prompts returned to the browser, or public cards.
- Model failure never fabricates progress, completes a rep, or publishes content.

## 19. Non-goals

- Post-launch market-performance tracking
- Scheduled historical outcome updates
- A second assistant that revisits old products
- Generic PM interview simulation
- General AI news reading
- Voice interviewing
- Course or framework library
- Public leaderboard or universal PM score
- Social feed or comments
- Resume, cover-letter, or job-matching workflows
- Team workspaces
- Payments
- Native mobile application
- Human approval as a required case-generation step
- Multi-provider model comparison
- Fully autonomous publication

## 20. Acceptance criteria for the v2 refinement

The refinement is acceptable only when all of the following are demonstrated:

1. The first five reps are labeled calibration and do not trigger adaptive routing.
2. After calibration, the default rep declares one target dimension based on repeated eligible first-pass evidence.
3. The next product is randomly claimed only from unseen candidates that support the target dimension.
4. `Surprise me` remains available as a separate unrestricted-random action.
5. Uncompleted product identity is absent from Case Inbox, pre-commit HTML, client assets, and API payloads.
6. `I recognize this launch` replaces the case without creating Skill Map evidence.
7. Original-source readability is checked and up to three candidate failures are replaced automatically.
8. The case generator never receives company identity or shipped-choice material.
9. Every active case passes a separate DeepSeek reviewer operation and deterministic gates.
10. Each case contains two to four evidence-supported questions and one verified target-dimension core question.
11. The core question collects an initial direction before showing three plausible options.
12. Every option is credible and non-dominated; obvious distractors fail activation.
13. Evidence uses only `Shipped fact`, `Company-reported`, or `Inference` provenance.
14. Committing preserves an immutable first-pass response.
15. Feedback exposes confidence and allows a dimension-level dispute.
16. Disputed observations do not influence adaptive routing.
17. The revision receives a separate evaluation and remains distinct from the original.
18. The Skill Map reports first-pass and revision-response signals separately with sample, recency, confidence, difficulty, and dispute context.
19. Reveal content compares `Your decision` with `What the company chose or shipped` and does not claim market success.
20. Only completed attempts may create a private Decision Card, and publication remains explicit and reversible.
21. The complete flow works at 320-pixel and desktop widths with keyboard-accessible controls.
22. Invalid model output, missing credentials, or failed gates create no progress, reveal leakage, or public content.

## 21. Current implementation gap

This PRD records approved product behavior, not completed implementation. The current repository state is:

| Product area | Current state | Required v2 change |
| --- | --- | --- |
| AI HOT pool | Selected-only, practice-fit, owner-scoped D1 pool implemented | Add source preflight and target-specific semantic eligibility |
| Selection | Random unseen `queued` selection implemented | Add five-rep calibration, target-first constrained random, and `Surprise me` |
| Candidate visibility | Full queued product details currently visible | Hide all uncompleted identities and reveal only completed history |
| Recognition | No recognized-product state | Add no-penalty `seen` lifecycle and automatic replacement |
| Case generation | Generator sees original source and produces exactly four prompts | Add evidence isolation, blind generation, and two-to-four-question depth |
| Options | Two to four choices allowed without a dedicated balance gate | Add initial direction, three credible options, non-dominance rules, and reviewer rejection |
| Evidence | `fact` and `inference` implemented | Replace with `Shipped fact`, `Company-reported`, and `Inference` |
| Reviewer | Gemini reviewer adapter currently implemented | Remove Gemini dependency and use a separate isolated DeepSeek reviewer operation |
| Feedback | First-pass evaluation implemented | Display confidence and add dimension-level dispute state |
| Revision | Revision is stored but not re-evaluated | Add revised evaluation and before-and-after comparison |
| Skill Map | Equal-weight average of completed pre-revision ratings | Add calibration, dual signals, recency, confidence, difficulty, and dispute handling |
| Difficulty | No difficulty model | Add `Structured`, `Trade-off`, and `Ambiguous` progression |
| Reveal | Uses outcome-oriented language | Compare learner decision with company choice or shipped product; remove market-outcome implication |
| Failure handling | A failed generated candidate returns an error | Add preflight and bounded three-candidate automatic replacement |

## 22. Approval and implementation boundary

The user approved the product decisions in this v2 refinement during the 2026-08-07 grilling session. This document update records the shared product definition only. No v2 code implementation, GitHub upload, credential change, or hosted deployment is part of this documentation task.
