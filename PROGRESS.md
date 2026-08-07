# Progress

## 2026-08-04 — Step 1 product definition completed

- Scope: create the PM Reps project definition package only; no application implementation.
- User decision: proceed through explicit step-by-step approval gates.
- Product decision: PM Reps converts verified AI product launches into short decision exercises and preserves the original response, evidence-linked feedback, and revision.
- Presentation decision: private practice and public Decision Cards are connected surfaces in one product.
- MVP decisions: single user, English interface, bilingual responses, one active case, manually verified fixed case first, AI HOT and model integration later.
- Trust decisions: commit before reveal, no real-outcome answer key, evidence-linked factual feedback, failed evaluations fail closed, and publishing is explicit and reversible.
- Files created: `README.md`, `docs/product-requirements.md`, and `PROGRESS.md`.
- Verification: reread all three files; confirmed the README links, PRD acceptance criteria and stage gates, exactly three project files, and no `package.json`, `app/`, or `src/` implementation scaffold. `STEP_1_CHECKS_PASSED`.
- Blocker: Step 2 requires explicit user approval after review of Step 1.
- Next step after approval: define technical architecture, data contracts, and AI evaluation plan.
- Status: awaiting Step 1 approval.

## 2026-08-04 — Step 1 approved; Step 2 architecture package completed

- User approval: the user replied `继续`, authorizing Step 2 only under the established per-step gate.
- Scope: technical architecture, versioned data contracts, trust boundaries, and AI evaluation design; no web application implementation.
- Architecture decision: Sites capability path with a public Site, protected practice routes, dispatch-owned Sign in with ChatGPT, D1 durable storage, server-side AI HOT and model adapters, and no MVP R2 storage.
- Leakage decision: build pre-commit and public payloads as new allowlisted projections; never send full internal cases to the browser and then hide fields client-side.
- State decision: committed original responses are immutable; revisions and publication state are separate records.
- Contract decision: define five JSON Schema Draft 2020-12 contracts for safe case, reveal, attempt, evaluation, and public Decision Card payloads.
- Evaluation decision: separate generator and evaluator, validate before persistence, require real evidence IDs, cover alternative valid decisions and bilingual responses, and fail closed on invalid output.
- Files added: `docs/technical-architecture.md`, `docs/data-contracts.md`, `docs/ai-evaluation-plan.md`, and five files under `schemas/`.
- Files updated: `README.md`, `docs/product-requirements.md`, and `PROGRESS.md`.
- Verification: reread all Step 2 documents; parsed all JSON files with `jq`; compiled all five schemas against JSON Schema Draft 2020-12 with strict checks and standard URI/date-time formats; confirmed `additionalProperties: false` at every contract root; confirmed prohibited reveal fields are absent from `case-public.v1`, private fields are absent from `decision-card-public.v1`, and no `package.json`, `app/`, `src/`, or local dependency directory exists. `STEP_2_CHECKS_PASSED`.
- Blocker: Step 3 requires explicit user approval after review of Step 2.
- Next step after approval: initialize the Sites web application and implement only the static application shell.
- Status: Step 2 verified; awaiting user approval.

## 2026-08-04 — Step 2 approved; Step 3 static application shell completed

- User approval: the user replied `继续`, authorizing Step 3 only.
- Scope: initialize the Sites project and replace the starter with a static PM Reps application shell; no persistence, authentication, model calls, AI HOT integration, or deployment.
- Product surfaces implemented as static routes: `/`, `/app/today`, `/app/feedback/sample`, `/app/skills`, and `/app/proof`.
- Visual decision: warm editorial canvas, dark-green trust accent, decision-first layout, responsive side/top navigation, restrained progress cues, and no generic dashboard or decorative imagery.
- Interaction boundary: navigation works, but decision controls, rationale input, feedback generation, revision, persistence, and publication actions remain disabled static examples for later steps.
- Starter cleanup: removed the disposable preview component, starter preview metadata, unused starter images, and `react-loading-skeleton`; renamed the package to `pm-reps` and refreshed the lockfile.
- Verification: development server returned the landing page successfully; production build completed; three rendered-HTML tests passed across the landing page and all four workspace surfaces; hosting bindings remain `null`; no browser visual QA or deployment was performed because Step 3 is local-only.
- Pitfall: the Sites initializer rejected the non-empty project root with `Target is not empty`. Root cause: Step 1 and Step 2 intentionally created project documents before the framework scaffold, while the initializer accepts only an empty target. Resolution: initialize the official starter in an isolated temporary directory, then copy only the scaffold into the project while excluding `.git` and the starter README. Prevention rule: in document-first gated Sites projects, use a controlled staging initialization and merge; never move, delete, or overwrite approved project documents to satisfy the empty-directory precondition.
- Pitfall: the development runtime reported an invalid React hook call while hot-reloading `next/link` after the scaffold and lockfile changed. The exact runtime cause was not proven. Resolution: the static shell uses server-rendered anchors, which need no client hook, and the development server was restarted cleanly. Prevention rule: for a static Sites shell, prefer plain anchors until client navigation behavior is required; restart the dev runtime after dependency graph changes.
- Blocker: Step 4 requires explicit user approval after review of Step 3.
- Next step after approval: implement the fixed-case `Today's Rep` flow using local fixture data only.
- Status: Step 3 verified; awaiting user approval.

## 2026-08-04 — Step 3 approved; Step 4 fixed-case decision flow completed

- User approval: the user replied `继续`, authorizing Step 4 only.
- Scope: make `Today's Rep` functional with one local, manually verified case; no authentication, database, model, AI HOT, feedback generation, publication, or deployment.
- Case decision: the hidden case is the launch of the Codex app, framed before commitment as a product decision about supervising longer-running, parallel AI coding-agent work. The pre-commit fixture contains no company name, product name, source URL, real outcome, or fabricated usage metric.
- Interaction implemented: four evidence-grounded questions, required choice and rationale, Back/Next navigation, session-scoped draft recovery, a four-item completeness review, commitment, immutable in-memory original-response snapshot, and post-commit reveal.
- Trust-boundary prototype: the browser receives an allowlisted public fixture. Reveal data lives in a server-only fixture and the local POST route rejects malformed or incomplete commitments before returning it with `Cache-Control: no-store`.
- Prototype limitation: without authentication and durable attempt storage, a caller can construct a complete POST directly. Step 4 demonstrates payload separation and the product flow, not production-grade committed ownership enforcement; that remains assigned to the authenticated D1 architecture.
- Files added: `app/lib/fixed-case.ts`, `app/lib/fixed-case-reveal.server.ts`, `app/app/today/TodayRepClient.tsx`, and `app/api/cases/fixed-agent-workspace-001/reveal/route.ts`.
- Files updated: `app/app/today/page.tsx`, `app/components/AppShell.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, `docs/data-contracts.md`, `README.md`, and `PROGRESS.md`.
- Verification: production build passed; five rendered/API tests passed; the pre-commit HTML test rejects the company, product name, source slug, and the old fabricated percentages; the reveal API rejects incomplete responses and returns the versioned reveal only for a structurally complete POST; the live local development route recovered to HTTP 200 after hot reload.
- Pitfall: the first API-route build could not resolve the fixture imports. Root cause: the relative path climbed five directories from the nested route when the application root required four. Resolution: corrected both imports to `../../../../lib/...` and rebuilt successfully. Prevention rule: for nested route modules, resolve and inspect the path from the route directory before running the first build; treat a successful production build as mandatory verification.
- Blocker: Step 5 requires explicit user approval after review of Step 4.
- Next step after approval: connect the fixed attempt to deterministic feedback, revision, Skill Map updates, and a private Decision Card preview without adding AI HOT or a live model yet.
- Status: Step 4 verified; awaiting user approval.

## 2026-08-04 — Remaining approval gates lifted; Steps 5–7 MVP completed

- User decision: the user explicitly requested that the remaining work be completed in one pass without further approval checkpoints.
- Durable workflow: added D1-backed attempts, immutable committed originals, separate revisions, evaluation state, completed-only skill observations, private Decision Card snapshots, and reversible publication.
- Identity boundary: hosted requests use Sites-provided authenticated user headers; a local-only fallback identity is accepted only for `localhost` and `127.0.0.1`. Public snapshots use a neutral display name when no full-name claim exists and never fall back to the authenticated email address.
- Feedback decision: the product remains usable through a visibly labeled deterministic `rules.v1` evaluator. A server-only OpenAI Responses API adapter uses structured output, the current `gpt-5.6-sol` model, low reasoning effort, `store: false`, bounded retry, schema checks, evidence-ID checks, and fail-closed behavior.
- Credential boundary: `OPENAI_API_KEY` was unavailable, so live model execution, bilingual comparison, repeatability baselines, and model-backed case generation remain explicitly unavailable rather than simulated.
- Source integration: added a live server-side Case Inbox using the AI HOT public selected `ai-products` feed. Items retain AI HOT permalinks and product attribution, are treated as untrusted candidate inputs, and cannot activate automatically.
- Portfolio surfaces: implemented actual feedback and revision, evidence-only Skill Map aggregation, private proof preview, explicit publish/unpublish, anonymous public card reads, and a portfolio handoff narrative.
- Social preview: generated and validated one project-specific landscape Open Graph image with exact product text, then wired host-derived Open Graph and X metadata.
- Persistence: added four D1 tables, actual query-driven indexes, runtime schema initialization for local dogfooding, and an inspected Drizzle migration. R2 remains unused.
- Verification: the production build passed; seven automated checks passed, including the full commit-to-unpublish lifecycle, cross-origin rejection, private-email exclusion, pre-commit HTML leakage, client-bundle leakage, and D1 migration checks. A live AI HOT request returned eight current candidates with attribution and the required review gate. Local end-to-end test data was removed from the dogfood identity after verification.
- Pitfall: direct Node loading of the Worker bundle failed after D1 introduced the `cloudflare:workers` module. Root cause: the default Node ESM loader cannot resolve Cloudflare runtime modules. Resolution: run rendered and API tests through Wrangler against the built Worker. Prevention rule: once a Sites project imports Cloudflare runtime bindings, execute integration tests in the Cloudflare-compatible runtime rather than importing the Worker directly into Node.
- Release decision: private dogfood release with the deterministic evaluation baseline. No live-model quality claim is permitted until the missing credential and planned evaluation corpus are available.
- Next step: publish privately, verify the production deployment, then collect dogfood evidence before expanding the active-case library.
- Status: Steps 5–7 implementation and local validation complete; private publication in progress.

## 2026-08-04 — Private Sites deployment succeeded

- Deployment decision: owner-only private access; no shared or public site access was authorized.
- Production result: Sites version 1 deployed successfully to a private owner-only URL.
- Hosted persistence: logical D1 binding `DB` and the generated migration were packaged with the validated build; R2 remains unused.
- Model runtime: no hosted `OPENAI_API_KEY` was configured. Production therefore uses the explicitly labeled deterministic evaluation baseline and retains the fail-closed model adapter for later activation.
- Handoff: the deployed site was opened in the Codex browser. The local development server was stopped after successful publication.
- Status: MVP implementation, verification, portfolio documentation, and private deployment complete.

## 2026-08-04 — GitHub publication blocked by authorization

- Requested destination: a new public repository named `pm-reps` under the authenticated GitHub account.
- Local readiness: the `main` branch is clean, the repository history is intact, and the existing private Sites remote is unchanged.
- Blocker: the supplied personal access token identifies the account but has no scopes; GitHub rejected repository creation because `public_repo` is required.
- Fallback check: no authenticated GitHub CLI session or signed-in browser session is available on this machine.
- Security handling: the token was used only as a process-scoped credential and was not written to project files, Git remotes, or Git configuration.
- Next step: authenticate with GitHub or provide a replacement credential with `public_repo`, then create `pm-reps` and push `main` without force.
- Status: GitHub publication not completed; no GitHub repository was created.

## 2026-08-05 — Public GitHub repository created

- Authorization: completed GitHub CLI device authorization; the previously supplied unscoped token was not reused.
- Repository: created the public `pm-reps` repository and added it as the credential-free `github` remote.
- Publication result: pushed the complete local `main` history without force and configured it to track `github/main`.
- Verification: GitHub reports a public repository with `main` as the default branch; local and remote commit SHAs matched, the remote URL contains no credential, and the worktree was clean.
- Status: public GitHub publication complete.

## 2026-08-05 — DeepSeek migration and public-repository privacy hardening

- Provider decision: replace the inactive OpenAI adapter with the official DeepSeek Chat Completions API and model ID `deepseek-v4-flash`.
- Runtime contract: use server-only `DEEPSEEK_API_KEY`, JSON mode, a bounded retry, local schema and evidence-ID validation, and the existing fail-closed rules fallback when no credential is configured.
- Credential status: no DeepSeek credential was available, so live model execution remains unavailable and was not simulated.
- Privacy correction: replaced direct personal identifiers in public source content with generic learner and deployment descriptions.
- Git correction: rebuilt the public branch as a single sanitized root commit with generic commit-author metadata.
- Verification: production build passed and all eight automated tests passed, including the DeepSeek endpoint, model, environment-key, and no-committed-credential checks.
- Repository remediation: because GitHub still exposed an unreachable old commit by direct SHA after a force-push, deleted the empty public repository and recreated it from the sanitized root commit; the old SHA then returned `404`.
- Remote verification: the recreated repository contains one `main` commit, the local and remote SHAs match, and current source and history scans contain no direct personal identifiers or committed credentials.
- Deployment result: published the validated DeepSeek-ready build as a new owner-only Sites version with no model secret configured.
- Next step: configure `DEEPSEEK_API_KEY` through hosted runtime settings, never Git, then run the planned live-model quality corpus before making model-quality claims.
- Status: provider migration, GitHub privacy remediation, automated verification, and private deployment complete.

## 2026-08-07 — Today redesign and independent automatic case verification completed locally

- User feedback: group the sidebar into `Practice` and `Progress & Proof`; place the full case brief before the task; label evidence by analytical role; shorten E-04 to `Need`; remove the human case-review dependency and use an independent API reviewer.
- Today surface: implemented the approved grouped navigation, three-step exercise flow, `Read the case brief` section, horizontal Scenario / Known Evidence / Constraints layout, evidence category plus `fact` or `inference` status, evidence insertion controls, and a single focused decision card.
- Fixed-case evidence correction: E-02 is explicitly labeled `inference`; E-01, E-03, E-04, and E-05 remain `fact`. E-04 uses the short `need` category.
- Candidate pipeline: AI HOT remains discovery-only. The server now preserves each linked original-source URL, rejects unsafe or unreadable sources, retrieves bounded text, and requires valid publication metadata.
- Generation and review: DeepSeek V4 Flash creates a structured case draft with exact source quotations. Gemini 3.6 Flash independently classifies every claim and checks source fidelity, fabricated metrics, and pre-commit leakage. Deterministic checks then require exact quotation matches, valid labels, schema integrity, and a consistent reviewer pass.
- Activation: only a fully passed case is stored as `active`; every missing credential, source failure, invalid model response, reviewer rejection, or deterministic mismatch preserves the existing active case. The fixed case remains the safe fallback.
- Durable state: added `generated_cases` with owner-scoped case/source uniqueness and an index supporting latest-active-case lookup. Generated attempts, feedback, revisions, and Decision Cards now load their own stored case bundle rather than the fixed fixture.
- Secrets: added empty `GEMINI_API_KEY` documentation beside the empty `DEEPSEEK_API_KEY`; no credential value was added. No GitHub push or deployment was performed in this change.
- Verification: `npm test` passed 9 tests; production build and lint passed; all JSON schemas parsed; the D1 migration was generated and inspected; `EXPLAIN QUERY PLAN` used `idx_generated_owner_status_created`; live local AI HOT returned 8 candidates with original-source URLs and a fail-closed configuration state; current-tree scans found no credential, personal email, local personal path, or direct personal identifier.
- Live-model limitation: neither server-side model credential is configured locally, so a real generated case and reviewer-quality baseline remain unavailable. The interface correctly disables activation and reports the fail-closed state.
- Pitfall: using the public case ID as the D1 primary key would collide when two owners generate the same AI HOT item. Root cause: a public source-derived identifier is not globally unique for owner-scoped records. Resolution: use an internal random row ID and separate `(owner_id, case_id)` and `(owner_id, source_item_id)` unique indexes. Prevention rule: keep public/domain identifiers separate from owner-scoped persistence keys and verify the intended lookup index before migration generation.
- Status: requested redesign and automatic dual-model verification are implemented and validated locally; hosted credential configuration and live quality evaluation remain next steps.

## 2026-08-07 — Selected-product practice pool and random unseen selection completed locally

- User decision: read only AI HOT selected AI products, save them locally before generation, keep only products that train product judgment, and randomly choose a product the learner has not done.
- Source contract: migrated discovery to the AI HOT v1 selected `ai-products` endpoint with cursor pagination, canonical AI HOT and original-source links, ETag support, a one-minute minimum sync interval, and no legacy all-items mode.
- Practice-fit gate: a product needs a valid publication time, at least 80 characters of summary material, coverage of at least two product dimensions, and a score of at least 75. Pure financing, stock, earnings, paper, benchmark, parameter-count, training-method, and minor-maintenance items are excluded unless they contain enough product-decision depth.
- Durable state: added owner-scoped `candidate_product_pool` and `candidate_pool_sync_state` D1 tables. Repeated syncs refresh metadata without resetting active, completed, or rejected state.
- Selection lifecycle: the next case is claimed with a database-random query from `queued` only, atomically changed to `generating`, activated only after DeepSeek generation plus independent Gemini review and deterministic gates, and marked `completed` only after the learner submits the post-feedback revision.
- Interface: rebuilt Case Inbox around the saved practice pool, ability tags, pool counts, and one random-uncompleted action. Removed per-candidate manual activation and added a next-rep action after completion.
- Local result: the current seven-day selected feed contained 25 products. Twelve failed the base practice gate and six more fell below the tightened score, leaving 7 locally saved, uncompleted practice candidates.
- Verification: production build, lint, JSON parsing, and all 10 integration tests passed. The local pool API returned 7 queued items with scores from 80 to 95. SQLite query planning used `idx_pool_owner_status_fit` before the random sort. Browser checks confirmed the desktop hierarchy and a 390-pixel mobile viewport with no horizontal overflow.
- Privacy and release boundary: tracked-tree scans found no credential-shaped value, personal email, personal local path, or direct personal identifier. No GitHub push or hosted deployment was performed.
- Pitfall: an AI HOT `304 Not Modified` response initially preserved six rows that no longer passed the tightened filter. Root cause: ETag freshness describes source data, not the current application filter semantics. Resolution: every `304` path now re-evaluates existing queued rows and removes derived candidates that fail the current practice-fit rule. Prevention rule: when a persistent derived pool depends on versioned local rules, reconcile stored queued records even when the upstream payload is unchanged; never treat an upstream `304` as proof that derived state is current.
- Status: selected-only ingestion, local practice filtering, durable random selection, no-repeat completion, UI, and local verification are complete. Live random case generation remains fail-closed until both private model credentials are configured.

## 2026-08-07 — Product grilling decisions consolidated into PRD v2

- User instruction: stop the product interview and update the existing PRD with every approved decision before any further implementation.
- Product focus: PM Reps now prioritizes deliberate, weakness-targeted practice over unrestricted novelty. Randomness remains inside the eligible target pool, with a separate `Surprise me` action.
- Calibration: the first five completed reps form a balanced calibration period. Skill patterns remain early signals until calibration completes.
- Curriculum: post-calibration selection starts with a target judgment dimension, filters the local pool to suitable products, randomly claims one unseen candidate, and requires one verified core question for that target.
- Learning model: first-pass judgment and revision response are separate signals. Revision must be re-evaluated, and revised performance cannot overwrite the original judgment.
- Feedback governance: the learner may dispute one evaluation dimension. Disputed and low-confidence observations cannot control adaptive selection.
- Difficulty: approved `Structured`, `Trade-off`, and `Ambiguous` levels, with performance interpreted in difficulty context rather than averaged as equivalent observations.
- Question design: cases contain two to four evidence-supported questions. The core question collects an initial direction before revealing three credible, non-dominated options; obvious distractors and answer cues fail review.
- Leakage controls: uncompleted candidate identities are hidden, recognized launches can be replaced without penalty, and the case generator sees only isolated decision-time evidence rather than the company's final choice.
- Evidence and reveal: evidence distinguishes `Shipped fact`, `Company-reported`, and `Inference`. Reveal compares `Your decision` with `What the company chose or shipped`; post-launch market tracking is explicitly out of scope.
- Model boundary: remove the planned Gemini dependency. One private DeepSeek integration performs distinct isolated evidence, generation, review, and learner-evaluation operations, followed by deterministic gates. Product copy must say `separate reviewer pass`, not independent or cross-provider review.
- Failure experience: source readability is preflighted and one start request may automatically replace up to three failed candidates before showing an error.
- Documentation: replaced the outdated Step 1 MVP PRD with a coherent v2 document containing updated principles, core flow, curriculum, AI behavior, functional requirements, acceptance criteria, non-goals, metrics, and an explicit current-implementation gap table.
- Scope boundary: this checkpoint changes only `docs/product-requirements.md` and project progress. No product code, credential, GitHub remote, or hosted deployment was changed.
- Verification: `git diff --check` passed; all approved decisions are represented in the PRD; the document contains no credential value, personal email, personal local path, or direct personal identifier.
- Status: PRD v2 is complete and ready for implementation planning when requested.

## 2026-08-07 — PRD v2 deliberate-practice implementation completed locally

- User authorization: implement the approved PRD in one pass. This checkpoint is local-only; no GitHub push, hosted deployment, or credential configuration was performed.
- Curriculum: added a five-rep balanced calibration period, first-pass weakness routing, gradual `structured` / `trade_off` / `ambiguous` difficulty, target-first candidate filtering, and a separate unrestricted `Surprise me` path.
- Practice signals: persisted first-pass and revision-response observations separately with confidence and difficulty context. Added dimension disputes and excluded disputed or low-confidence first-pass observations from adaptive routing.
- Exercise contract: introduced `case-public.v2` and `case-reveal.v2`, two-to-four questions, one target-dimension core prompt, a required initial direction before choices appear, exactly three plausible options, and `shipped_fact` / `company_reported` / `inference` provenance.
- Feedback and proof: revisions are evaluated again without overwriting the original evaluation. Feedback shows both signals, and Decision Cards compare the learner's result with what the company chose or shipped without post-launch market tracking.
- Candidate privacy: queued identities are no longer returned to the browser. Case Inbox shows anonymous dimension coverage and reveals titles and sources only for completed products. Recognized launches become `seen`, create no skill evidence, and trigger an automatic replacement.
- Source and model pipeline: selected-only AI HOT ingestion now preflights original sources. One DeepSeek credential powers isolated evidence extraction, blind generation, a separate reviewer pass, and response evaluation through distinct prompts and contracts; all Gemini configuration and runtime calls were removed.
- Failure handling: one start request can replace up to three source or quality failures before returning a learner-safe error. Failed candidates never affect attempts or Skill Map evidence.
- Persistence: added revision evaluations, signal metadata, source-preflight timestamps, and `evaluation_disputes`; generated and inspected `drizzle/0003_vengeful_power_pack.sql`; runtime schema upgrades add missing columns before creating the replacement composite index.
- Verification checkpoint: the production build completed and the updated integration suite passed all 10 tests, including commit/reveal, separate revision evaluation, dispute exclusion, Skill Map dual signals, reversible proof, fail-closed DeepSeek configuration, migrations, and no Gemini dependency.
- Status: PRD v2 product behavior is implemented locally; final lint, schema parsing, privacy scan, and regression rerun remain before handoff.

## 2026-08-07 — PRD v2 final local verification passed

- Regression: `npm test` rebuilt the production Worker and passed all 10 integration tests.
- Static checks: ESLint passed; `git diff --check` passed; every JSON file under `schemas`, `.openai`, and `drizzle/meta` parsed successfully.
- Privacy and credential scan: no credential-shaped value, personal email, personal local path, or direct personal identifier was found outside the test scanner's own literal patterns. The only documented environment assignment remains an empty `DEEPSEEK_API_KEY=` placeholder.
- Release boundary: no GitHub staging, commit, push, repository mutation, hosted secret configuration, or deployment was performed.
- Runtime boundary: no live DeepSeek request was attempted because no local key is configured. Automatic generation remains deliberately fail-closed, while the fixed case and deterministic fixed-case evaluator remain usable.
- Status: local PRD v2 implementation and verification are complete.

## 2026-08-07 — July selected-product history backfilled into the local pool

- User request: expand the small practice pool with every currently selected AI HOT product news item from July 2026 onward that is suitable for product-judgment practice.
- Source boundary: interpreted the user's `AI House` reference as the established AI HOT source. Used the anonymous read-only v1 selected snapshot with `fields=default`, completed all pages under one stable snapshot cursor, and did not use `mode=all`.
- Time boundary: applied the AI HOT timeline rule from `2026-07-01T00:00:00+08:00`; recent items use discovery time while historical backfills delayed by more than 72 hours use publication time.
- Reusable capability: added an authenticated, same-origin historical backfill route and a snapshot client. Routine seven-day sync remains unchanged; explicit backfills reuse the exact same practice-fit scoring, owner scoping, status preservation, and original-source preflight.
- Actual local result: inspected 3,186 currently selected snapshot items, including 812 selected product items across the full snapshot and 185 selected product items in the July-to-current range. Saved or refreshed 56 practice-fit, source-readable products; excluded 111 for insufficient exercise value and 18 for unreadable or insufficient original sources.
- Pool verification: the local dogfood pool now contains 56 queued unseen cases. Coverage is 49 user/problem, 51 evidence use, 11 metrics/evals, 21 AI-system awareness, and 49 rollout judgment; one product may cover multiple dimensions.
- Privacy: the browser API still returns only anonymous queued counts and coverage. Product titles and sources remain hidden until completion.
- Release boundary: local D1 only; no GitHub push or hosted deployment was performed.
- Status: historical July backfill completed successfully; final automated regression remains before handoff.

## 2026-08-07 — July backfill final verification passed

- Regression: production build and all 10 integration tests passed with the new historical backfill route included.
- Static checks: ESLint and `git diff --check` passed; the privacy scan found no credential-shaped value, personal email, personal local path, or direct personal identifier.
- Durable-state proof: a fresh anonymous Case Inbox read from the existing local development server returned exactly 56 queued items and the full-pool dimension coverage recorded above; no queued title or source was present in the browser payload.
- Status: July-to-current selected-product pool expansion is complete and locally verified.
