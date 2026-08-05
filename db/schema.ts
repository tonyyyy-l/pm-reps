import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { CaseResponse } from "../app/lib/fixed-case";
import type { Evaluation } from "../app/lib/evaluation";
import type { DecisionCardSnapshot } from "../app/lib/proof";

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
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_skill_attempt_dimension").on(
      table.attemptId,
      table.dimension,
    ),
    index("idx_skill_owner_dimension").on(table.ownerId, table.dimension),
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
