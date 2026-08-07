import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { sourceIngestionRuns } from "@/db/schema";
import {
  getCandidatePool,
  syncSelectedProductPool,
} from "@/app/lib/candidate-pool.server";
import { automaticCasePipelineStatus } from "@/app/lib/case-generation.server";
import { getPracticePlan } from "@/app/lib/curriculum.server";
import { requireRequestUser } from "@/app/lib/request-user";

export async function GET(request: Request) {
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  let syncWarning = "";
  let syncResult = { synced: false, addedOrUpdated: 0, excluded: 0 };
  try {
    syncResult = await syncSelectedProductPool(auth.user.userId);
    await getDb().insert(sourceIngestionRuns).values({
      id: crypto.randomUUID(),
      ownerId: auth.user.userId,
      status: "selected_product_pool_synced",
      itemCount: syncResult.addedOrUpdated,
      candidates: [
        {
          selectedProductsSaved: syncResult.addedOrUpdated,
          practiceFitExcluded: syncResult.excluded,
        },
      ],
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    syncWarning =
      "AI HOT sync is temporarily unavailable. The existing local product pool is still usable.";
  }

  const pool = await getCandidatePool(auth.user.userId);
  if (!pool.counts.total && syncWarning) {
    return Response.json(
      { error: "AI HOT is unavailable and the local product pool is empty." },
      { status: 503 },
    );
  }
  const [automation, plan] = [
    automaticCasePipelineStatus(),
    await getPracticePlan(auth.user.userId),
  ];
  return Response.json(
    {
      completed: pool.items.filter((item) => item.status === "completed").map((item) => ({
        id: item.sourceItemId,
        title: item.title,
        summary: item.summary,
        source: item.sourceName,
        publishedAt: item.publishedAt,
        discoveredAt: item.discoveredAt,
        permalink: item.aiHotUrl,
        sourceUrl: item.originalUrl,
        status: item.status,
        fitScore: item.fitScore,
        fitDimensions: item.fitDimensions,
        fitReason: item.fitReason,
      })),
      pool: {
        counts: pool.counts,
        coverage: pool.coverage,
        synced: syncResult.synced,
        addedOrUpdated: syncResult.addedOrUpdated,
        excluded: syncResult.excluded,
        warning: syncWarning || null,
      },
      source: { name: "AI HOT", canonical: "https://aihot.virxact.com/" },
      practicePlan: plan,
      automation: {
        ready: automation.ready,
        status: automation.ready
          ? "DeepSeek generation and the separate reviewer pass are ready."
          : "The anonymous selected-product pool is saved locally. Case generation remains fail-closed until DEEPSEEK_API_KEY is configured.",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
