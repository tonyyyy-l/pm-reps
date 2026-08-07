import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { candidatePoolSyncState, candidateProductPool } from "@/db/schema";
import {
  fetchAiHotCandidates,
  fetchSelectedProductSnapshotSince,
  fetchSourceDocument,
  type AiHotCandidate,
} from "./ai-hot.server";

export type PracticeDimension =
  | "user_problem"
  | "evidence_use"
  | "metric_validity"
  | "ai_system_awareness"
  | "rollout_judgment";

export type CandidatePoolStatus =
  | "queued"
  | "generating"
  | "active"
  | "completed"
  | "rejected"
  | "seen"
  | "preflight_failed";

const minimumSyncIntervalMs = 60_000;

export async function syncSelectedProductPool(ownerId: string) {
  const db = getDb();
  const [state] = await db
    .select()
    .from(candidatePoolSyncState)
    .where(eq(candidatePoolSyncState.ownerId, ownerId))
    .limit(1);
  const now = new Date();
  if (
    state &&
    now.getTime() - new Date(state.lastSyncedAt).getTime() < minimumSyncIntervalMs
  ) {
    return { synced: false, addedOrUpdated: 0, excluded: 0 };
  }

  const sync = await fetchAiHotCandidates({
    etag: state?.etag,
    etagUrl: state?.etagUrl,
  });
  const syncedAt = now.toISOString();
  if (sync.notModified) {
    const excluded = await reconcileQueuedPool(ownerId);
    await upsertSyncState(ownerId, syncedAt, sync.etagUrl, sync.etag);
    return { synced: false, addedOrUpdated: 0, excluded };
  }

  const saved = await savePracticeFitCandidates(ownerId, sync.candidates, syncedAt);
  await upsertSyncState(ownerId, syncedAt, sync.etagUrl, sync.etag);
  return {
    synced: true,
    addedOrUpdated: saved.addedOrUpdated,
    excluded: saved.excluded,
  };
}

export async function backfillSelectedProductPoolSince(
  ownerId: string,
  since: string,
) {
  const snapshot = await fetchSelectedProductSnapshotSince(since);
  const saved = await savePracticeFitCandidates(
    ownerId,
    snapshot.candidates,
    new Date().toISOString(),
  );
  return {
    ...saved,
    snapshotItemCount: snapshot.snapshotItemCount,
    selectedProductCount: snapshot.selectedProductCount,
    inDateRange: snapshot.candidates.length,
    since: snapshot.since,
    asOf: snapshot.asOf,
  };
}

async function savePracticeFitCandidates(
  ownerId: string,
  candidates: AiHotCandidate[],
  syncedAt: string,
) {
  const db = getDb();
  const totals = {
    addedOrUpdated: 0,
    excluded: 0,
    practiceFitExcluded: 0,
    unreadableSourceExcluded: 0,
  };
  for (let offset = 0; offset < candidates.length; offset += 4) {
    const results = await Promise.all(
      candidates.slice(offset, offset + 4).map((candidate) =>
        saveCandidate(ownerId, candidate, syncedAt),
      ),
    );
    for (const result of results) {
      if (result === "saved") totals.addedOrUpdated += 1;
      if (result === "practice_fit_excluded") totals.practiceFitExcluded += 1;
      if (result === "unreadable_source") totals.unreadableSourceExcluded += 1;
    }
  }
  totals.excluded = totals.practiceFitExcluded + totals.unreadableSourceExcluded;
  return totals;

  async function saveCandidate(
    scopedOwnerId: string,
    candidate: AiHotCandidate,
    seenAt: string,
  ) {
    const fit = assessPracticeFit(candidate);
    if (!fit.eligible) {
      await db
        .delete(candidateProductPool)
        .where(
          and(
            eq(candidateProductPool.ownerId, scopedOwnerId),
            eq(candidateProductPool.sourceItemId, candidate.id),
            eq(candidateProductPool.status, "queued"),
          ),
        );
      return "practice_fit_excluded" as const;
    }
    const [existing] = await db
      .select({ sourcePreflightAt: candidateProductPool.sourcePreflightAt })
      .from(candidateProductPool)
      .where(
        and(
          eq(candidateProductPool.ownerId, scopedOwnerId),
          eq(candidateProductPool.sourceItemId, candidate.id),
        ),
      )
      .limit(1);
    let sourcePreflightAt = existing?.sourcePreflightAt ?? null;
    if (!sourcePreflightAt) {
      try {
        await fetchSourceDocument(candidate);
        sourcePreflightAt = seenAt;
      } catch {
        await db
          .delete(candidateProductPool)
          .where(
            and(
              eq(candidateProductPool.ownerId, scopedOwnerId),
              eq(candidateProductPool.sourceItemId, candidate.id),
              eq(candidateProductPool.status, "queued"),
            ),
          );
        return "unreadable_source" as const;
      }
    }
    await db
      .insert(candidateProductPool)
      .values({
        id: crypto.randomUUID(),
        ownerId: scopedOwnerId,
        sourceItemId: candidate.id,
        title: candidate.title,
        summary: candidate.summary,
        sourceName: candidate.source ?? "Source unavailable",
        publishedAt: candidate.publishedAt,
        discoveredAt: candidate.discoveredAt,
        aiHotUrl: candidate.permalink,
        originalUrl: candidate.sourceUrl,
        status: "queued",
        fitScore: fit.score,
        fitDimensions: fit.dimensions,
        fitReason: fit.reason,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
        sourcePreflightAt,
      })
      .onConflictDoUpdate({
        target: [candidateProductPool.ownerId, candidateProductPool.sourceItemId],
        set: {
          title: candidate.title,
          summary: candidate.summary,
          sourceName: candidate.source ?? "Source unavailable",
          publishedAt: candidate.publishedAt,
          discoveredAt: candidate.discoveredAt,
          aiHotUrl: candidate.permalink,
          originalUrl: candidate.sourceUrl,
          fitScore: fit.score,
          fitDimensions: fit.dimensions,
          fitReason: fit.reason,
          lastSeenAt: seenAt,
          sourcePreflightAt,
        },
      });
    return "saved" as const;
  }
}

export async function getCandidatePool(ownerId: string, limit = 30) {
  const db = getDb();
  const [items, grouped, queuedCoverageItems] = await Promise.all([
    db
      .select()
      .from(candidateProductPool)
      .where(eq(candidateProductPool.ownerId, ownerId))
      .orderBy(desc(candidateProductPool.discoveredAt))
      .limit(limit),
    db
      .select({ status: candidateProductPool.status, total: count() })
      .from(candidateProductPool)
      .where(eq(candidateProductPool.ownerId, ownerId))
      .groupBy(candidateProductPool.status),
    db
      .select({ fitDimensions: candidateProductPool.fitDimensions })
      .from(candidateProductPool)
      .where(
        and(
          eq(candidateProductPool.ownerId, ownerId),
          eq(candidateProductPool.status, "queued"),
        ),
      ),
  ]);
  const counts = {
    total: 0,
    queued: 0,
    generating: 0,
    active: 0,
    completed: 0,
    rejected: 0,
    seen: 0,
    preflight_failed: 0,
  };
  for (const row of grouped) {
    const status = row.status as CandidatePoolStatus;
    if (status in counts) counts[status] = row.total;
    counts.total += row.total;
  }
  const coverage = dimensionsForCoverage.map((dimension) => ({
    dimension,
    count: queuedCoverageItems.filter((item) =>
      item.fitDimensions.includes(dimension),
    ).length,
  }));
  return { items, counts, coverage };
}

export async function claimRandomUncompletedProduct(
  ownerId: string,
  targetDimension?: PracticeDimension,
) {
  const db = getDb();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [candidate] = await db
      .select()
      .from(candidateProductPool)
      .where(
        and(
          eq(candidateProductPool.ownerId, ownerId),
          eq(candidateProductPool.status, "queued"),
          targetDimension
            ? sql`${candidateProductPool.fitDimensions} LIKE ${`%\"${targetDimension}\"%`}`
            : undefined,
        ),
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);
    if (!candidate) return null;
    const [claimed] = await db
      .update(candidateProductPool)
      .set({ status: "generating", selectedAt: new Date().toISOString() })
      .where(
        and(
          eq(candidateProductPool.id, candidate.id),
          eq(candidateProductPool.ownerId, ownerId),
          eq(candidateProductPool.status, "queued"),
        ),
      )
      .returning();
    if (claimed) return claimed;
  }
  return null;
}

export async function setPoolItemStatus(
  ownerId: string,
  sourceItemId: string,
  status: CandidatePoolStatus,
  options?: { failureClass?: string | null; selectedAt?: string; completedAt?: string },
) {
  await getDb()
    .update(candidateProductPool)
    .set({
      status,
      failureClass: options?.failureClass,
      selectedAt: options?.selectedAt,
      completedAt: options?.completedAt,
    })
    .where(
      and(
        eq(candidateProductPool.ownerId, ownerId),
        eq(candidateProductPool.sourceItemId, sourceItemId),
      ),
    );
}

export function poolItemToCandidate(item: typeof candidateProductPool.$inferSelect): AiHotCandidate {
  return {
    id: item.sourceItemId,
    title: item.title,
    summary: item.summary,
    source: item.sourceName,
    category: "ai-products",
    publishedAt: item.publishedAt,
    discoveredAt: item.discoveredAt,
    permalink: item.aiHotUrl,
    sourceUrl: item.originalUrl,
  };
}

function assessPracticeFit(candidate: AiHotCandidate) {
  const text = `${candidate.title} ${candidate.summary ?? ""}`.toLowerCase();
  const dimensions: PracticeDimension[] = [];
  const dimensionSignals: Array<[PracticeDimension, RegExp]> = [
    [
      "user_problem",
      /用户|客户|开发者|消费者|企业|团队|工作流|场景|体验|痛点|需求|user|customer|developer|consumer|enterprise|workflow|use case|experience|problem/,
    ],
    [
      "evidence_use",
      /功能|产品|应用|助手|智能体|界面|平台|集成|定价|订阅|优先|取舍|feature|product|app|assistant|agent|interface|platform|integration|pricing|subscription|priority|trade-?off/,
    ],
    [
      "metric_validity",
      /指标|采用率|留存|转化|完成率|使用率|准确率|误报|降低|提升|增长|metric|adoption|retention|conversion|completion|usage|accuracy|false positive|reduc|improv|growth/,
    ],
    [
      "ai_system_awareness",
      /安全|隐私|权限|幻觉|错误|失败|回退|风控|滥用|深度伪造|guardrail|safety|privacy|permission|hallucination|failure|fallback|abuse|deepfake|risk/,
    ],
    [
      "rollout_judgment",
      /发布|上线|测试|灰度|内测|公测|阶段|地区|平台|开放|扩展|launch|release|rollout|beta|pilot|staged|region|platform|availability|expand/,
    ],
  ];
  for (const [dimension, pattern] of dimensionSignals) {
    if (pattern.test(text)) dimensions.push(dimension);
  }
  const hardExclude =
    /融资|估值|募资|收购|股票|财报|论文|arxiv|基准跑分|参数量|训练方法|小幅更新|修复|补丁|版本维护|funding|valuation|acquisition|stock|earnings|paper|benchmark|parameter count|training method|minor update|bug fix|patch release|maintenance release/.test(
      text,
    ) && dimensions.length < 3;
  const validPublishedAt =
    Boolean(candidate.publishedAt) && !Number.isNaN(Date.parse(candidate.publishedAt ?? ""));
  let score = 20;
  if ((candidate.summary?.length ?? 0) >= 100) score += 15;
  if ((candidate.summary?.length ?? 0) >= 220) score += 5;
  score += Math.min(dimensions.length, 4) * 15;
  if (/取舍|风险|限制|权衡|trade-?off|risk|limitation|constraint/.test(text)) score += 10;
  if (!validPublishedAt) score -= 30;
  if (hardExclude) score -= 50;
  score = Math.max(0, Math.min(100, score));
  const eligible =
    !hardExclude &&
    validPublishedAt &&
    (candidate.summary?.length ?? 0) >= 80 &&
    dimensions.length >= 2 &&
    score >= 75;
  return {
    eligible,
    score,
    dimensions,
    reason: eligible
      ? `Exercises ${dimensions.join(", ")} with enough launch evidence for a product trade-off.`
      : "Insufficient product-decision depth or source evidence for a PM Reps exercise.",
  };
}

async function upsertSyncState(
  ownerId: string,
  lastSyncedAt: string,
  etagUrl: string,
  etag: string | null,
) {
  await getDb()
    .insert(candidatePoolSyncState)
    .values({ ownerId, lastSyncedAt, etagUrl, etag })
    .onConflictDoUpdate({
      target: candidatePoolSyncState.ownerId,
      set: { lastSyncedAt, etagUrl, etag },
    });
}

async function reconcileQueuedPool(ownerId: string) {
  const db = getDb();
  const queued = await db
    .select()
    .from(candidateProductPool)
    .where(
      and(
        eq(candidateProductPool.ownerId, ownerId),
        eq(candidateProductPool.status, "queued"),
      ),
    );
  let excluded = 0;
  for (const item of queued) {
    const fit = assessPracticeFit(poolItemToCandidate(item));
    if (fit.eligible) {
      await db
        .update(candidateProductPool)
        .set({
          fitScore: fit.score,
          fitDimensions: fit.dimensions,
          fitReason: fit.reason,
        })
        .where(eq(candidateProductPool.id, item.id));
      continue;
    }
    await db
      .delete(candidateProductPool)
      .where(
        and(
          eq(candidateProductPool.id, item.id),
          eq(candidateProductPool.ownerId, ownerId),
          eq(candidateProductPool.status, "queued"),
        ),
      );
    excluded += 1;
  }
  return excluded;
}

const dimensionsForCoverage: PracticeDimension[] = [
  "user_problem",
  "evidence_use",
  "metric_validity",
  "ai_system_awareness",
  "rollout_judgment",
];
