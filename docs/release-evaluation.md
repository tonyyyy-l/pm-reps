# PM Reps MVP Release Evaluation

## Release decision

**Private dogfood release with rules baseline.**

The core learning loop is ready for private use. Model-generated case drafting and live model-quality claims are not part of this release because no server-side DeepSeek API credential was available for execution and evaluation.

## Verified product flow

- Commit two to four complete decisions, including the core initial direction, before reveal.
- Store the original response as an immutable attempt field with no update route.
- Reveal the company, product, what it chose or shipped, and verified source only after durable commitment.
- Return all five rubric dimensions with bounded ratings and valid evidence IDs.
- Keep rules-based feedback visibly labeled and separate from model output.
- Save and evaluate revisions separately from original responses.
- Update Skill Map observations only after a valid evaluation and completed revision.
- Create a private Decision Card snapshot only after completion.
- Publish and unpublish the public snapshot through explicit owner actions.
- Return `404` for an unpublished public-card slug.
- Fetch only selected AI product candidates from AI HOT, preflight and save only practice-fit items in the private pool, target a practice dimension, randomly claim an unseen eligible item, and activate only after DeepSeek's separate reviewer pass plus deterministic checks.

## Automated evidence

The release suite covers:

1. landing and all private workspace routes;
2. pre-commit HTML leakage;
3. emitted client-bundle leakage;
4. incomplete and cross-origin commitment rejection;
5. commit, reveal, five-dimension evaluation, revision, and completion;
6. completed-only Skill Map updates;
7. private proof creation, publication, public retrieval, unpublication, and post-unpublication `404`;
8. public snapshot exclusion of the authenticated email address; and
9. D1 migration and required indexes.

## Evaluation gates

| Gate | Status | Evidence |
| --- | --- | --- |
| E1 contract validity | Passed for deterministic evaluator | Five dimensions, bounded enums, and evidence IDs verified end to end |
| E2 citation integrity | Passed for deterministic evaluator | Every supported factual claim cites existing case evidence |
| E3 commit-before-reveal | Passed | Pre-commit HTML and client assets contain no prohibited reveal values |
| E4 alternative decisions | Partial | Rules copy does not call alternatives incorrect; multi-case model corpus unavailable |
| E5 bilingual consistency | Unavailable | Requires live model baseline and matched bilingual responses |
| E6 repeatability | Deterministic baseline passed | Rules evaluator is deterministic; live model repeatability unavailable |
| E7 shallow terminology resistance | Partial | Rules baseline uses evidence and system-awareness signals; full corpus unavailable |
| E8 prompt-injection resistance | Design passed, model run unavailable | External text remains server-side untrusted input; no live model credential |
| E9 fail-closed behavior | Passed by implementation | Configured model failures create no evaluation, skill progress, or public content |
| E10 cross-model disagreement | Contract implemented, live baseline unavailable | Reviewer rejection reasons are structured; no credential-backed corpus has run yet |

## Known limitations

- The fixed case is the active fallback until the DeepSeek credential is configured and an automatic case passes.
- The deterministic evaluator is a transparent baseline, not a substitute for model-quality evidence.
- AI HOT candidates can become active only through isolated evidence extraction, blind DeepSeek generation, a separate DeepSeek reviewer pass, and deterministic source-quotation/leakage gates.
- Repeated AI HOT syncs do not reset completed or active pool items to queued, and random selection never draws a completed item.
- Live generation and reviewer baselines are unavailable until the server-side DeepSeek credential is configured.
- No baseline exists yet for completion rate, weekly retention, bilingual agreement, or human disagreement; these metrics must not be estimated.

## Next evidence to collect

1. Complete the fixed case repeatedly with deliberately different reasoning quality.
2. Record agreement or disagreement with each feedback dimension.
3. Configure a server-side model credential and run the planned bilingual, alternative-decision, repeatability, and injection corpus.
4. Run at least ten source packs through the automatic dual-model gate and report exact rejection categories before claiming generation quality.
