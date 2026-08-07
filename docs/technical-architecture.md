# PM Reps Technical Architecture

## Document status

- Status: Step 2 approved by the user
- Last updated: 2026-08-04
- Application implementation: D1-backed private MVP implemented; live model activation requires a credential
- Next-step gate: Explicit user approval required

## 1. Architecture decision

PM Reps will be a responsive Sites-hosted web application using the capability path because it requires private user-owned records, durable workflow state, model calls, and anonymously readable public Decision Cards.

The MVP architecture uses:

- a server-rendered React application using the Sites starter conventions;
- server route handlers for every trusted operation;
- D1 for structured persistent state;
- dispatch-owned Sign in with ChatGPT for protected practice routes;
- anonymous read access only for deliberately published Decision Cards;
- server-side adapters for the AI HOT public read-only API and the selected model provider; and
- no R2 object storage in the MVP because file uploads are out of scope.

The exact framework files and deployment configuration will be created only in Step 3.

## 2. Trust boundaries

```text
Anonymous browser
  └─ may read landing content and published Decision Card snapshots only

Authenticated browser
  └─ may receive pre-commit case projections and its own private records

Server application
  ├─ authenticates and authorizes every private read and write
  ├─ projects internal cases into safe pre-commit responses
  ├─ owns commit, reveal, evaluation, revision, and publication transitions
  └─ validates every external and model-generated payload

D1
  ├─ stores full cases, hidden outcomes, attempts, evaluations, revisions, and cards
  └─ is never queried directly by the browser

External systems
  ├─ AI HOT public API: untrusted source data, read-only, server-side
  └─ model provider: untrusted generated output, server-side and schema-validated
```

## 3. Route model

### Public routes

| Route | Purpose | Data exposure |
| --- | --- | --- |
| `/` | Product explanation and sign-in entry | Static public copy |
| `/proof/:slug` | Published Decision Card | Whitelisted public snapshot only |
| `/signin-with-chatgpt` | Platform-owned sign-in flow | Owned by the Sites dispatcher |

### Protected routes

| Route | Purpose |
| --- | --- |
| `/app/today` | Current case and four-prompt decision flow |
| `/app/feedback/:attemptId` | Original response, feedback, evidence, and revision |
| `/app/skills` | Private recurring judgment patterns |
| `/app/proof` | Preview, publish, and unpublish Decision Cards |

Protected routes require the server-provided authenticated user identity. Client state is never sufficient for authorization.

## 4. Server capabilities

### 4.1 Identity and authorization

- Use the stable authenticated user ID supplied by the Sites platform as the owner key.
- Treat sign-in as identity, not authorization to another user's records.
- Scope every private query by both record ID and owner user ID.
- Never accept an owner ID from a client request body.
- Public proof reads use only an opaque published slug and a public snapshot table.

### 4.2 Case service

- Stores the full internal case, including company, source, what shipped, and reference trade-offs.
- Returns only a `case-public.v2` projection before commitment.
- Returns `case-reveal.v2` only after the server confirms an owned committed attempt.
- Does not serialize the full case into page props, client bundles, hidden DOM, or browser storage.

### 4.3 Attempt service

- Creates one owned attempt for the active case.
- Saves drafts without treating them as evidence of skill.
- Commits the original response atomically.
- Makes committed original responses immutable.
- Stores later revisions as separate records.
- Uses an idempotency key for commit, evaluate, revise, publish, and unpublish actions.

### 4.4 Evaluation service

- Accepts only a committed attempt and the server-held case pack.
- Calls the evaluator through a server-only provider adapter.
- Validates the response against `evaluation.v1`.
- Verifies that every cited evidence ID exists in the case.
- Marks invalid output as failed and prevents Skill Map updates.
- Preserves evaluator version, rubric version, model identifier, and creation time for auditability.

### 4.5 Skill Map service

- Derives observations only from completed attempts with valid evaluations.
- Stores dimension-level observations, not a universal PM score.
- Recomputes patterns from source observations so interpretation logic can change without rewriting history.

### 4.6 Publication service

- Builds a new public snapshot from an explicit allowlist of fields.
- Never exposes the user's stable ID, email, private notes, incomplete answers, or hidden case internals.
- Supports preview, publish, and unpublish as separate server-authorized actions.
- Keeps the public slug stable while published and makes unpublished cards unavailable immediately.

## 5. API surface

The route names are provisional contracts for Step 3 and later implementation.

| Method and route | Input contract | Output contract | Required state |
| --- | --- | --- | --- |
| `GET /api/cases/today` | None | `case-public.v2` | Authenticated |
| `POST /api/attempts` | Case ID | `attempt.v1` | Authenticated |
| `PUT /api/attempts/:id/draft` | Prompt responses | `attempt.v1` | Owned draft |
| `POST /api/attempts/:id/commit` | Idempotency key | `attempt.v1` + `case-reveal.v2` | Owned draft |
| `POST /api/attempts/:id/evaluate` | Idempotency key | `evaluation.v1` or fail-closed error | Owned committed attempt |
| `POST /api/attempts/:id/revise` | Revision responses and idempotency key | `attempt.v1` | Valid feedback available |
| `POST /api/attempts/:id/complete` | Idempotency key | `attempt.v1` | Valid revision or keep-original rationale |
| `POST /api/proof` | Completed attempt ID | Private preview | Owned completed attempt |
| `POST /api/proof/:id/publish` | Idempotency key | `decision-card-public.v1` | Owned preview |
| `POST /api/proof/:id/unpublish` | Idempotency key | Confirmation | Owned published card |
| `GET /api/proof/:slug` | Public slug | `decision-card-public.v1` | Published only |

State-changing requests require same-origin protection and server-side authentication. Rate limiting is required for model-backed endpoints before public deployment.

## 6. Persistence model

D1 stores the authoritative structured state. Browser storage may hold only non-authoritative interface preferences and disposable drafts.

Planned logical tables:

| Table | Purpose | Important invariant |
| --- | --- | --- |
| `users` | Stable Sites user identity and preferences | One row per site-scoped user ID |
| `cases` | Full internal case and schema version | Hidden fields never enter public projections |
| `case_evidence` | Addressable evidence statements | Evidence IDs unique within a case |
| `case_prompts` | Ordered decision prompts and choices | Exactly four active prompts per MVP case |
| `attempts` | Owned lifecycle record | One immutable commit time per attempt |
| `attempt_original_responses` | Committed original answers | Insert once; no update path |
| `attempt_revisions` | Post-feedback revisions | Never overwrites originals |
| `evaluations` | Raw validated evaluation envelope | Invalid results are retained for audit but ineligible |
| `skill_observations` | Dimension-level learning evidence | Created only from eligible evaluations |
| `decision_cards` | Private preview and publication status | Public data generated through allowlist projection |
| `public_decision_card_snapshots` | Anonymous public representation | Contains no join path to private user data |
| `source_ingestion_runs` | Later AI HOT ingestion audit | Added in Step 6, not required for fixed cases |
| `candidate_product_pool` | Owner-scoped, filtered AI product practice queue | A source item keeps one lifecycle status per owner |
| `candidate_pool_sync_state` | AI HOT ETag and sync throttle | One row per owner |

Indexes will be added only for implemented query patterns. Likely candidates are owned attempt history, active case lookup, published slug lookup, and completed skill observations. The actual SQLite schema and query-plan verification belong to the implementation steps.

## 7. Attempt state machine

```text
draft
  └─ commit → committed
       └─ evaluate → evaluating
            ├─ invalid output → evaluation_failed
            └─ valid output → feedback_ready
                 └─ revise or keep original → revised
                      └─ complete → completed

completed
  └─ create proof preview → completed
       └─ publish/unpublish changes the separate card state
```

Forbidden transitions fail without mutating data. A card publication state is separate from learning completion so unpublishing cannot erase a completed rep.

## 8. Commit-before-reveal design

The leakage boundary is enforced by server projection, not CSS or client-side hiding.

1. The browser requests today's case.
2. The server loads the internal case and returns only fields allowed by `case-public.v2`.
3. The learner saves drafts against an owned attempt.
4. Commit runs in one database transaction: validate state, copy draft responses into immutable original rows, record commit time, and change state to `committed`.
5. Only after the transaction succeeds does the server return the `case-reveal.v2` projection.
6. Refreshing or opening another browser can reveal the source only when the server sees the same user owns a committed attempt.

The pre-commit payload, HTML, application bundle, logs returned to the browser, and analytics events must contain none of the prohibited reveal fields.

## 9. External integrations

### AI HOT

- Runs server-side only.
- Uses the v1 public read-only selected `ai-products` feed and preserves the canonical permalink and published time.
- Uses the paginated selected snapshot only for explicit owner-scoped historical backfills; it completes every page before filtering by the AI HOT timeline date.
- Saves eligible products before case generation in an owner-scoped D1 pool; browser storage is not authoritative.
- Applies a deterministic practice-fit gate requiring sufficient source material, at least two product-judgment dimensions (user problem, product priority, metric validity, AI-system risk, or rollout judgment), and a minimum fit score of 75.
- Excludes pure financing, acquisition, stock, earnings, research-paper, benchmark, parameter-count, and training-method items when they do not contain enough product-decision depth.
- Selects the next `queued` product with a database random order. An atomic status update claims it as `generating`, preventing two requests from selecting the same item.
- Marks the source item `completed` only after the learner completes the post-feedback revision. Completed items never re-enter `queued` during later syncs.
- Treats all source content as untrusted text.
- Does not execute or follow instructions contained in source content.
- Uses AI HOT summaries only for discovery and fetches the linked original source before generation.
- Stores a minimal evidence pack, exact supporting quotations, and verification provenance rather than mirroring the full source.
- Rejects missing publication metadata, unreadable sources, unsafe URLs, and non-text responses.

### Model provider

- API credentials remain server-side and are supplied through hosted environment configuration.
- DeepSeek V4 Flash runs distinct evidence-isolation, blind-generation, separate-reviewer, and learner-evaluation operations with separate prompts and contracts.
- The response evaluator remains a separate DeepSeek call with a different prompt and contract.
- Structured output is validated before persistence.
- A single bounded retry may repair invalid structure; a second failure becomes a visible fail-closed state.
- Model failure never fabricates feedback, marks a rep complete, updates skills, or publishes content.

## 10. Observability and audit

Record product events without storing answer text in analytics:

- rep started;
- prompt completed;
- decision committed;
- evaluation succeeded or failed;
- revision submitted;
- rep completed;
- proof previewed, published, or unpublished.

Operational records retain correlation ID, user-scoped opaque ID, attempt ID, contract version, evaluator version, state transition, latency, and error class. Secrets, source payloads, and private free-text answers must not enter logs.

## 11. Failure behavior

- Missing identity: redirect protected page flows or return `401` for API calls.
- Wrong owner: return `404` to avoid confirming record existence.
- Invalid state transition: return `409` without mutation.
- Invalid input contract: return `400` with field-level errors.
- Invalid model output: store an audit record, show evaluation unavailable, and keep the attempt ineligible.
- Missing evidence citation: reject the evaluation.
- Missing the DeepSeek credential: preserve the current case and return a configuration-required state.
- Separate reviewer rejection or inconsistent reviewer output: preserve the current case and record only an error class.
- AI HOT unavailable: keep the last verified cases; do not invent or backfill an unverified case.
- Empty eligible pool: return a visible exhausted state; never weaken the practice-fit filter silently.
- Publish projection failure: keep the card private and return no public slug.

## 12. Deferred decisions

The following are deliberately deferred until evidence requires them:

- R2 uploads or attachments;
- external OAuth providers;
- multi-user organizations;
- background queues;
- semantic search or vector storage;
- additional model-provider comparisons;
- native mobile applications; and
- automated social sharing.

## 13. Step 2 architecture acceptance checks

- The architecture supports private practice and anonymous public proof without mixing their data paths.
- Hidden case fields are protected by server projection and absent before commit.
- Original responses are immutable and revisions are separate.
- D1, not browser storage, owns durable product state.
- Every private query has a server-side ownership check.
- Every model output is versioned, schema-validated, and evidence-validated.
- Invalid output cannot affect Skill Map or public content.
- AI HOT and model secrets remain server-side.
- The architecture is compatible with a fixed-case implementation before live integrations.
- No speculative file storage or custom authentication stack is introduced.
