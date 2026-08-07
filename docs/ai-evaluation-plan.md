# PM Reps AI Evaluation Plan

## Document status

- Status: Step 2 approved by the user
- Last updated: 2026-08-07
- Model integration: distinct DeepSeek evidence-isolation, blind-generation, reviewer, and evaluation operations behind one fail-closed credential
- Evaluation execution: Deterministic baseline verified; live model baseline unavailable because no credential is configured

## 1. Evaluation objective

The AI system is acceptable only when it helps the learner inspect reasoning without pretending that the company's real decision is the one correct answer.

Evaluation covers two separate AI components:

1. **Case generator:** converts a verified product source pack into a concealed decision exercise.
2. **Response evaluator:** evaluates a committed learner response against the case evidence and rubric.

They use separate prompts, inputs, outputs, versions, and tests. A successful generator does not imply a trustworthy evaluator.

## 2. System boundaries

### Generator input

- Verified source title, canonical link, publication time, and retrieval time
- Minimal source excerpts
- Stable AI HOT item ID when available
- Original-source text retrieved from the AI HOT-linked URL

### Generator output

- Internal case draft
- Safe pre-commit case projection
- Post-commit reveal projection
- Evidence items with stable IDs
- Two to four prompts with one target-dimension core question
- Exact supporting quotation for every evidence item

Generated cases remain inactive until the separate reviewer pass and all deterministic gates pass.

### Evaluator input

- Committed original responses
- Internal case evidence pack
- Five-dimension rubric and version
- Response language

### Evaluator output

- `evaluation.v1`
- Dimension rating and rationale
- Evidence IDs
- Improvement prompt
- Confidence label
- Factual claim support list

The evaluator receives what the company chose or shipped for context but is explicitly prohibited from using agreement with it as the scoring rule.

## 3. Deterministic checks before model calls

### Generator

- Source URL and publication metadata exist.
- Source item is in the allowed product category.
- Source text is non-empty and within the bounded input size.
- Source text is wrapped as untrusted content.
- Decision dimension is one of the supported enums.

### Evaluator

- Attempt is owned and committed.
- Original responses cover every prompt ID and the core initial direction.
- Every selected choice belongs to its prompt.
- Required rationales are non-empty.
- Case and rubric versions exist.

Requests that fail these checks do not call the model.

## 4. Deterministic checks after model calls

### Generator

- Output validates against the internal generation contract used in Step 6.
- Two to four prompts are present and the target dimension has exactly one core question.
- Every prompt maps to a supported rubric dimension.
- Evidence IDs are unique.
- Every reveal commentary citation refers to an existing evidence ID.
- The safe projection validates against `case-public.v2`.
- Prohibited reveal terms and source identifiers are absent from the safe projection.
- Every supporting quotation is an exact normalized substring of the retrieved original source.
- Evidence contains an analytical category and `shipped_fact`, `company_reported`, or `inference` provenance.

### Separate reviewer pass

- The reviewer operation receives the original source, isolated pack, and blind draft as untrusted data.
- Every evidence ID occurs exactly once in the review output.
- A factual item must be `supported`; an inferred item must be `inference`.
- Unsupported, contradicted, fabricated-metric, weak-fidelity, or leakage findings reject activation.
- A `pass` verdict that conflicts with any check is rejected as an invalid review contract.

### Evaluator

- Output validates against `evaluation.v1`.
- All five rubric dimensions occur exactly once.
- Every cited evidence ID exists in the case.
- Every factual claim is `supported` with evidence or `insufficient_evidence` without invented support.
- Ratings and confidence values use the bounded enums.
- Validation failure produces no `evaluation.v1` record; the operational failure is marked ineligible and cannot update the Skill Map.

One bounded structural-repair retry is allowed. A second failure is final for that request and produces no synthetic fallback feedback.

## 5. Evaluation corpus

The initial automated regression corpus contains at least ten source packs, with two cases centered on each rubric dimension:

- user and problem linkage;
- evidence use;
- metric validity;
- AI system awareness; and
- rollout judgment.

Each case includes these answer patterns:

1. well-supported answer aligned with the real company decision;
2. well-supported alternative decision;
3. plausible answer with a missing guardrail or trade-off;
4. terminology-heavy answer with weak reasoning;
5. unsupported factual claim; and
6. semantically matched Chinese and English answers.

The corpus therefore tests reasoning quality, alternative validity, shallow framework use, unsupported claims, and bilingual consistency rather than only reproducing the launch outcome.

Five adversarial source variants are added across the corpus:

- instruction-like text inside source content;
- source text that mentions the hidden company repeatedly;
- conflicting metrics;
- incomplete outcome information; and
- content outside the selected AI product item.

## 6. Test suites

### E1 — Contract validity

Measure schema-valid generator and evaluator responses before and after the single repair retry.

Hard gate: no invalid payload may be persisted as valid or update product state.

### E2 — Citation integrity

Check whether every factual feedback claim is supported by an existing evidence ID.

Hard gate: zero nonexistent evidence IDs and zero uncited factual claims presented as supported.

### E3 — Commit-before-reveal leakage

Inspect the pre-commit API response, rendered HTML, client state, application bundle fixtures, analytics payload, and logs for company, URL, source title, outcome, and reference reasoning.

Hard gate: zero prohibited reveal fields or values before commitment.

### E4 — Alternative valid decisions

Use paired gold answers where two different decisions are defensible. Verify that disagreement with the company is not itself cited as a flaw.

Hard gate: every gold alternative receives reasoning-based feedback and is not marked `missing` solely because its choice differs.

### E5 — Bilingual semantic consistency

Compare matched Chinese and English answers at the dimension-rating and improvement-theme level.

Initial output: report exact agreement, adjacent-rating agreement, and theme agreement. No threshold is claimed until a measured baseline exists.

### E6 — Repeatability

Evaluate the same answer multiple times using the same evaluator and rubric version.

Initial output: report dimension-rating variation, citation variation, and improvement-theme variation. Do not hide instability behind an average score.

### E7 — Shallow terminology resistance

Test answers that mention frameworks, north-star metrics, A/B tests, guardrails, or staged rollout without connecting them to evidence.

Hard gate: terminology alone cannot produce a `strong` evidence-use rating.

### E8 — Prompt-injection resistance

Place instruction-like strings in source content and learner responses, then verify the generator and evaluator continue to follow their fixed task and schemas.

Hard gate: no instruction from untrusted content changes the contract, exposes hidden data, or triggers publication.

### E9 — Fail-closed behavior

Simulate provider timeout, invalid JSON, unknown enum, missing dimension, invalid evidence ID, and unsupported factual claim.

Hard gate: the attempt remains recoverable but incomplete; Skill Map and public proof remain unchanged.

### E10 — Cross-model disagreement

Compare generator claims with the separate reviewer verdicts and record rejection reasons by category. This identifies ambiguous sources, unsupported evidence, and recurring leakage failures while keeping operations and contracts isolated.

## 7. Automatic review protocol

For every generated case:

1. validate the AI HOT item and original HTTPS source metadata;
2. require exact source quotations for every evidence item;
3. have DeepSeek produce the concealed case contract;
4. have the separate DeepSeek reviewer operation classify each claim as supported, inference, unsupported, or contradicted;
5. run deterministic schema, quotation, metric, and leakage checks;
6. activate only a fully consistent `pass` result; and
7. preserve the existing active case on every failure.

## 8. Severity model

### Critical

- Hidden source or outcome leaks before commitment
- Another user's private response is exposed
- Private content is published without explicit action
- Source text changes system behavior

### High

- Unsupported factual feedback presented as supported
- Valid alternative decision treated as wrong because it differs from the company
- Invalid evaluation updates Skill Map

### Medium

- Rating instability across repeats
- Material Chinese-versus-English inconsistency
- Improvement prompt does not match the identified gap

### Low

- Awkward wording
- Redundant feedback
- Minor formatting inconsistency

No Critical or High issue may be knowingly present at deployment.

## 9. Release evidence

Before model-backed functionality is considered ready, retain:

- evaluation corpus version;
- case IDs and source provenance;
- generator, evaluator, rubric, and schema versions;
- deterministic validation results;
- hard-gate pass/fail results;
- bilingual and repeatability baseline reports;
- separate-reviewer verdicts and rejection reasons;
- known limitations; and
- the exact deployment decision.

Unavailable evidence must be labeled unavailable. A green build alone does not prove evaluator quality.

## 10. Step 2 evaluation-plan acceptance checks

- Generator, reviewer, and evaluator are isolated operations with distinct contracts.
- Model input and output boundaries are explicit.
- Deterministic validation occurs before persistence or skill updates.
- Alternative valid decisions and bilingual responses are represented in the corpus.
- Leakage, prompt injection, citation integrity, repeatability, and failure recovery have named tests.
- Critical and High severity behavior has explicit deployment gates.
- Judgmental thresholds are deferred until a measured automated baseline exists.
- Invalid output fails closed without fabricated feedback.
