import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { sourceIngestionRuns } from "@/db/schema";
import { backfillSelectedProductPoolSince } from "@/app/lib/candidate-pool.server";
import { rejectCrossOrigin, requireRequestUser } from "@/app/lib/request-user";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  let body: { since?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Backfill request must be valid JSON." }, { status: 400 });
  }
  if (!body.since || !/^\d{4}-\d{2}-\d{2}$/.test(body.since)) {
    return Response.json({ error: "Backfill start date must use YYYY-MM-DD." }, { status: 400 });
  }
  await ensureSchema();
  try {
    const result = await backfillSelectedProductPoolSince(
      auth.user.userId,
      `${body.since}T00:00:00+08:00`,
    );
    await getDb().insert(sourceIngestionRuns).values({
      id: crypto.randomUUID(),
      ownerId: auth.user.userId,
      status: "selected_product_history_backfilled",
      itemCount: result.addedOrUpdated,
      candidates: [
        {
          since: body.since,
          snapshotItemsChecked: result.snapshotItemCount,
          selectedProductsInRange: result.inDateRange,
          savedPracticeCases: result.addedOrUpdated,
          practiceFitExcluded: result.practiceFitExcluded,
          unreadableSourceExcluded: result.unreadableSourceExcluded,
        },
      ],
      fetchedAt: result.asOf,
    });
    return Response.json(
      { backfill: result },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error: "AI HOT history could not be fully verified, so no incomplete backfill was reported as complete.",
      },
      { status: 502 },
    );
  }
}
