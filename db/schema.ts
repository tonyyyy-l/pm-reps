import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { CaseResponse } from "../app/lib/fixed-case";
import type { Evaluation } from "../app/lib/evaluation";
import type { DecisionCardSnapshot } from "../app/lib/proof";
import type { AutomaticReview } from "../app/lib/case-generation.server";
import type { PublicCase } from "../app/lib/fixed-case";
import type { FixedCaseReveal } from "../app/lib/fixed-case-reveal.server";

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    caseId: text("case_id").notNull(),
    status: text("status").notNull(),
    startedAt: text("started_at").notNull(),
    committedAt: text("committed_at").notNull(),
    completedAt: text("completed_at"),
    originalResponses: text("original_responses", { mode: "json" })
      .$type<CaseResponse[]>()
      .notNull(),
    revisionResponses: text("revision_responses", { mode: "json" }).$type<
      CaseResponse[] | null
    >(),
    evaluation: text("evaluation", { mode: "json" }).$type<Evaluation | null>(),
    evaluatorMode: text("evaluator_mode"),
    revisionEvaluation: text("revision_evaluation", { mode: "json" }).$type<Evaluation | null>(),
    revisionEvaluatorMode: text("revision_evaluator_mode"),
  },
  (table) => [
    index("idx_attempts_owner_committed").on(table.ownerId, table.committedAt),
    index("idx_attempts_owner_status").on(table.ownerId, table.status),
  ],
);

export const skillObservations = sqliteTable(
  "skill_observations",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    attemptId: text("attempt_id").notNull(),
    dimension: text("dimension").notNull(),
    rating: text("rating").notNull(),
    rationale: text("rationale").notNull(),
    signalType: text("signal_type").notNull().default("first_pass"),
    confidence: text("confidence").notNull().default("medium"),
    difficulty: text("difficulty").notNull().default("structured"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_skill_attempt_dimension_signal").on(
      table.attemptId,
      table.dimension,
      table.signalType,
    ),
    index("idx_skill_owner_dimension").on(table.ownerId, table.dimension),
  ],
);

export const evaluationDisputes = sqliteTable(
  "evaluation_disputes",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    attemptId: text("attempt_id").notNull(),
    dimension: text("dimension").notNull(),
    reason: text("reason"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_dispute_attempt_dimension").on(table.attemptId, table.dimension),
    index("idx_dispute_owner_status").on(table.ownerId, table.status),
  ],
);

export const decisionCards = sqliteTable(
  "decision_cards",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    attemptId: text("attempt_id").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("private"),
    snapshot: text("snapshot", { mode: "json" })
      .$type<DecisionCardSnapshot>()
      .notNull(),
    createdAt: text("created_at").notNull(),
    publishedAt: text("published_at"),
  },
  (table) => [
    uniqueIndex("idx_cards_attempt").on(table.attemptId),
    uniqueIndex("idx_cards_slug").on(table.slug),
    index("idx_cards_owner_created").on(table.ownerId, table.createdAt),
  ],
);

export const sourceIngestionRuns = sqliteTable(
  "source_ingestion_runs",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    status: text("status").notNull(),
    itemCount: integer("item_count").notNull(),
    candidates: text("candidates", { mode: "json" }).$type<unknown[]>().notNull(),
    fetchedAt: text("fetched_at").notNull(),
    errorClass: text("error_class"),
  },
  (table) => [index("idx_ingestion_owner_fetched").on(table.ownerId, table.fetchedAt)],
);

export const generatedCases = sqliteTable(
  "generated_cases",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    ownerId: text("owner_id").notNull(),
    sourceItemId: text("source_item_id").notNull(),
    status: text("status").notNull(),
    publicCase: text("public_case", { mode: "json" }).$type<PublicCase>().notNull(),
    reveal: text("reveal", { mode: "json" }).$type<FixedCaseReveal>().notNull(),
    review: text("review", { mode: "json" }).$type<AutomaticReview>().notNull(),
    sourceQuotes: text("source_quotes", { mode: "json" })
      .$type<Array<{ evidenceId: string; quote: string }>>()
      .notNull(),
    generatorVersion: text("generator_version").notNull(),
    reviewerVersion: text("reviewer_version").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_generated_owner_case").on(table.ownerId, table.caseId),
    uniqueIndex("idx_generated_owner_source").on(table.ownerId, table.sourceItemId),
    index("idx_generated_owner_status_created").on(
      table.ownerId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const candidateProductPool = sqliteTable(
  "candidate_product_pool",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    sourceItemId: text("source_item_id").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    sourceName: text("source_name").notNull(),
    publishedAt: text("published_at"),
    discoveredAt: text("discovered_at").notNull(),
    aiHotUrl: text("ai_hot_url").notNull(),
    originalUrl: text("original_url").notNull(),
    status: text("status").notNull().default("queued"),
    fitScore: integer("fit_score").notNull(),
    fitDimensions: text("fit_dimensions", { mode: "json" }).$type<string[]>().notNull(),
    fitReason: text("fit_reason").notNull(),
    firstSeenAt: text("first_seen_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    selectedAt: text("selected_at"),
    completedAt: text("completed_at"),
    failureClass: text("failure_class"),
    sourcePreflightAt: text("source_preflight_at"),
  },
  (table) => [
    uniqueIndex("idx_pool_owner_source").on(table.ownerId, table.sourceItemId),
    index("idx_pool_owner_status_fit").on(
      table.ownerId,
      table.status,
      table.fitScore,
    ),
    index("idx_pool_owner_discovered").on(table.ownerId, table.discoveredAt),
  ],
);

export const candidatePoolSyncState = sqliteTable("candidate_pool_sync_state", {
  ownerId: text("owner_id").primaryKey(),
  lastSyncedAt: text("last_synced_at").notNull(),
  etagUrl: text("etag_url"),
  etag: text("etag"),
});
