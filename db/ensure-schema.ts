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
    evaluator_mode TEXT,
    revision_evaluation TEXT,
    revision_evaluator_mode TEXT
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
    signal_type TEXT NOT NULL DEFAULT 'first_pass',
    confidence TEXT NOT NULL DEFAULT 'medium',
    difficulty TEXT NOT NULL DEFAULT 'structured',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_skill_owner_dimension
    ON skill_observations(owner_id, dimension)`,
  `CREATE TABLE IF NOT EXISTS evaluation_disputes (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    attempt_id TEXT NOT NULL,
    dimension TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_dispute_attempt_dimension
    ON evaluation_disputes(attempt_id, dimension)`,
  `CREATE INDEX IF NOT EXISTS idx_dispute_owner_status
    ON evaluation_disputes(owner_id, status)`,
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
  `CREATE TABLE IF NOT EXISTS generated_cases (
    id TEXT PRIMARY KEY NOT NULL,
    case_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    source_item_id TEXT NOT NULL,
    status TEXT NOT NULL,
    public_case TEXT NOT NULL,
    reveal TEXT NOT NULL,
    review TEXT NOT NULL,
    source_quotes TEXT NOT NULL,
    generator_version TEXT NOT NULL,
    reviewer_version TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_owner_case
    ON generated_cases(owner_id, case_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_owner_source
    ON generated_cases(owner_id, source_item_id)`,
  `CREATE INDEX IF NOT EXISTS idx_generated_owner_status_created
    ON generated_cases(owner_id, status, created_at)`,
  `CREATE TABLE IF NOT EXISTS candidate_product_pool (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    source_item_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source_name TEXT NOT NULL,
    published_at TEXT,
    discovered_at TEXT NOT NULL,
    ai_hot_url TEXT NOT NULL,
    original_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    fit_score INTEGER NOT NULL,
    fit_dimensions TEXT NOT NULL,
    fit_reason TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    selected_at TEXT,
    completed_at TEXT,
    failure_class TEXT,
    source_preflight_at TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_pool_owner_source
    ON candidate_product_pool(owner_id, source_item_id)`,
  `CREATE INDEX IF NOT EXISTS idx_pool_owner_status_fit
    ON candidate_product_pool(owner_id, status, fit_score)`,
  `CREATE INDEX IF NOT EXISTS idx_pool_owner_discovered
    ON candidate_product_pool(owner_id, discovered_at)`,
  `CREATE TABLE IF NOT EXISTS candidate_pool_sync_state (
    owner_id TEXT PRIMARY KEY NOT NULL,
    last_synced_at TEXT NOT NULL,
    etag_url TEXT,
    etag TEXT
  )`,
] as const;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const binding = env.DB;
      if (!binding) throw new Error("D1 binding DB is unavailable.");
      await binding.batch(
        schemaStatements.map((statement) => binding.prepare(statement)),
      );
      await addColumnIfMissing(binding, "attempts", "revision_evaluation", "TEXT");
      await addColumnIfMissing(binding, "attempts", "revision_evaluator_mode", "TEXT");
      await addColumnIfMissing(binding, "skill_observations", "signal_type", "TEXT NOT NULL DEFAULT 'first_pass'");
      await addColumnIfMissing(binding, "skill_observations", "confidence", "TEXT NOT NULL DEFAULT 'medium'");
      await addColumnIfMissing(binding, "skill_observations", "difficulty", "TEXT NOT NULL DEFAULT 'structured'");
      await addColumnIfMissing(binding, "candidate_product_pool", "source_preflight_at", "TEXT");
      await binding.prepare("DROP INDEX IF EXISTS idx_skill_attempt_dimension").run();
      await binding.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_attempt_dimension_signal ON skill_observations(attempt_id, dimension, signal_type)").run();
      await binding.prepare("PRAGMA optimize").run();
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function addColumnIfMissing(
  binding: {
    prepare(query: string): {
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  },
  tableName: string,
  columnName: string,
  declaration: string,
) {
  const result = await binding.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>();
  if (result.results.some((column: { name: string }) => column.name === columnName)) return;
  await binding.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${declaration}`).run();
}
