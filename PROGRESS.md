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
- Git correction: the public branch must be rebuilt with generic commit-author metadata so historical source content and author metadata do not retain personal identifiers.
- Verification: production build passed and all eight automated tests passed, including the DeepSeek endpoint, model, environment-key, and no-committed-credential checks.
- Next step: complete the history rewrite, force-update only the public `main` branch, verify the remote tree and history, then redeploy the validated site without a model secret.
- Status: implementation verified; public-history remediation and deployment in progress.
