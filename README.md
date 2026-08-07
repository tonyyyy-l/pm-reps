# PM Reps

PM Reps turns verified AI product launches into short, evidence-grounded product judgment exercises.

The learner must commit to a decision before seeing the company, source material, or what the company chose or shipped. The product then provides rubric-based feedback, re-evaluates a revision, and saves the reasoning trail as a private learning record or a public Decision Card.

## Current status

The end-to-end MVP is complete and ready for private deployment.

The product now supports durable private attempts, two-to-four evidence-grounded decisions, commitment-before-reveal, five-dimension feedback, separately evaluated revisions, disputed-feedback exclusion, calibrated deliberate-practice routing, reversible Decision Card publication, and an anonymous private AI HOT practice pool. DeepSeek V4 Flash performs isolated evidence extraction, blind case generation, a separate reviewer pass, and learner evaluation before deterministic quality and leakage gates can activate a case.

## Product surfaces

- `Today's Rep`: one short decision exercise based on a real AI product launch.
- `Case Inbox`: an anonymous, durable practice-fit pool with targeted and surprise selection.
- `Feedback`: evidence-linked feedback that evaluates reasoning rather than agreement with the company.
- `Skill Map`: recurring judgment patterns across completed exercises.
- `Public Proof`: recruiter-readable Decision Cards showing decision, rationale, evidence, feedback, and revision.

## Product principles

- The learner writes an initial direction and decides before the product reveals what the company chose or shipped.
- Different decisions can be valid when the reasoning is defensible.
- Feedback must cite case evidence and separate facts from inference.
- Revision is part of the exercise, not an optional afterthought.
- Private practice history stays private unless the learner explicitly publishes a Decision Card.
- The first viewport is the decision, not a dashboard.

## Documentation

- [MVP product requirements](docs/product-requirements.md)
- [Technical architecture](docs/technical-architecture.md)
- [Versioned data contracts](docs/data-contracts.md)
- [AI evaluation plan](docs/ai-evaluation-plan.md)
- [Release evaluation](docs/release-evaluation.md)
- [Portfolio handoff](docs/portfolio-handoff.md)
- [Project progress](PROGRESS.md)

## Current operating boundary

The fixed case remains the safe fallback. PM Reps reads only AI HOT selected products and stores only practice-fit products in an owner-scoped D1 pool. Routine refresh uses the selected seven-day `ai-products` feed; an owner-scoped backfill can page the complete selected snapshot and apply a bounded start date before the same fit and source-readability gates. A deterministic filter requires sufficient source material, coverage of at least two judgment dimensions, and a minimum fit score of 75; pure funding, benchmark, paper, and minor-update items are excluded. Random selection draws only from `queued` products. The selected product becomes `completed` only after the learner submits a post-feedback revision, so it cannot be drawn again.

AI HOT summaries are discovery leads only: ingestion preflights the linked original source, DeepSeek isolates decision-time evidence from the shipped choice, generates a blind structured draft, and runs a separate reviewer pass. Deterministic gates verify quotations, provenance, target coverage, option quality, and leakage. Dynamic activation requires only server-side `DEEPSEEK_API_KEY`; a missing credential or any failed gate leaves the current case unchanged while the saved practice pool remains available.
