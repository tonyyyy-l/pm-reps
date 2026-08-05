# PM Reps

PM Reps turns verified AI product launches into short, evidence-grounded product judgment exercises.

The learner must commit to a decision before seeing the company, source material, or real launch outcome. The product then provides rubric-based feedback, asks for a revision, and saves the reasoning trail as a private learning record or a public Decision Card.

## Current status

The end-to-end MVP is complete and ready for private deployment.

The product now supports durable private attempts, four evidence-grounded decisions, commitment-before-reveal, five-dimension feedback, revision, Skill Map observations, reversible Decision Card publication, and a live AI HOT case-candidate inbox. A labeled deterministic evaluator keeps the product usable without a model credential; a fail-closed DeepSeek V4 Flash adapter activates only when `DEEPSEEK_API_KEY` is configured.

## Product surfaces

- `Today's Rep`: one short decision exercise based on a real AI product launch.
- `Feedback`: evidence-linked feedback that evaluates reasoning rather than agreement with the company.
- `Skill Map`: recurring judgment patterns across completed exercises.
- `Public Proof`: recruiter-readable Decision Cards showing decision, rationale, evidence, feedback, and revision.

## Product principles

- The learner decides before the product reveals the real outcome.
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

The fixed case is active and manually verified. AI HOT items enter only the Case Inbox and require source review before they can become active exercises. Model-generated evaluation is unavailable until a server-side DeepSeek API credential is configured; the product labels rules-based feedback and never presents it as model output.
