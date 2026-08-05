import { env } from "cloudflare:workers";

let schemaReady: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    committed_at TEXT NOT NULL,
    completed_at TEXT,
    original_responses TEXT NOT NULL,
    revision_responses TEXT,
    evaluation TEXT,
    evaluator_mode TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_owner_committed
    ON attempts(owner_id, committed_at)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_owner_status
    ON attempts(owner_id, status)`,
  `CREATE TABLE IF NOT EXISTS skill_observations (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    attempt_id TEXT NOT NULL,
    dimension TEXT NOT NULL,
    rating TEXT NOT NULL,
    rationale TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_attempt_dimension
    ON skill_observations(attempt_id, dimension)`,
  `CREATE INDEX IF NOT EXISTS idx_skill_owner_dimension
    ON skill_observations(owner_id, dimension)`,
  `CREATE TABLE IF NOT EXISTS decision_cards (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    attempt_id TEXT NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'private',
    snapshot TEXT NOT NULL,
    created_at TEXT NOT NULL,
    published_at TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_attempt
    ON decision_cards(attempt_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_slug
    ON decision_cards(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_owner_created
    ON decision_cards(owner_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS source_ingestion_runs (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    status TEXT NOT NULL,
    item_count INTEGER NOT NULL,
    candidates TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    error_class TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ingestion_owner_fetched
    ON source_ingestion_runs(owner_id, fetched_at)`,
] as const;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const binding = env.DB;
      if (!binding) throw new Error("D1 binding DB is unavailable.");
      await binding.batch(
        schemaStatements.map((statement) => binding.prepare(statement)),
      );
      await binding.prepare("PRAGMA optimize").run();
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}
