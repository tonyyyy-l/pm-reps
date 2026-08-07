import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { generatedCases, sourceIngestionRuns } from "@/db/schema";
import {
  claimRandomUncompletedProduct,
  poolItemToCandidate,
  setPoolItemStatus,
  syncSelectedProductPool,
} from "@/app/lib/candidate-pool.server";
import {
  AutomaticCaseError,
  automaticCasePipelineStatus,
  generateAndVerifyCase,
} from "@/app/lib/case-generation.server";
import { getPracticePlan, type PracticeMode } from "@/app/lib/curriculum.server";
import type { Dimension } from "@/app/lib/evaluation";
import {
  rejectCrossOrigin,
  requireRequestUser,
} from "@/app/lib/request-user";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  let body: { mode?: PracticeMode; replaceRecognizedCaseId?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // An empty body uses the deliberate-practice default.
  }
  const mode: PracticeMode = body.mode === "surprise" ? "surprise" : "targeted";
  if (!automaticCasePipelineStatus().ready) {
    return Response.json(
      {
        error: "Case generation is unavailable until the server-side DeepSeek credential is configured.",
        code: "configuration_required",
      },
      { status: 503 },
    );
  }

  const db = getDb();
  if (body.replaceRecognizedCaseId) {
    const [recognized] = await db
      .select({ sourceItemId: generatedCases.sourceItemId })
      .from(generatedCases)
      .where(
        and(
          eq(generatedCases.ownerId, auth.user.userId),
          eq(generatedCases.caseId, body.replaceRecognizedCaseId),
          eq(generatedCases.status, "active"),
        ),
      )
      .limit(1);
    if (recognized) {
      await db
        .update(generatedCases)
        .set({ status: "seen" })
        .where(
          and(
            eq(generatedCases.ownerId, auth.user.userId),
            eq(generatedCases.caseId, body.replaceRecognizedCaseId),
          ),
        );
      await setPoolItemStatus(auth.user.userId, recognized.sourceItemId, "seen");
    }
  }

  const [existing] = await db
    .select({ publicCase: generatedCases.publicCase })
    .from(generatedCases)
    .where(
      and(
        eq(generatedCases.ownerId, auth.user.userId),
        eq(generatedCases.status, "active"),
      ),
    )
    .orderBy(desc(generatedCases.createdAt))
    .limit(1);
  if (existing && !body.replaceRecognizedCaseId) {
    return Response.json(
      { status: "already_active", caseData: existing.publicCase },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  await syncSelectedProductPool(auth.user.userId).catch(() => undefined);
  const plan = await getPracticePlan(auth.user.userId, mode);
  let lastErrorClass = "pool_exhausted";
  for (let replacement = 0; replacement < 3; replacement += 1) {
    const poolItem = await claimRandomUncompletedProduct(
      auth.user.userId,
      mode === "targeted" ? plan.targetDimension : undefined,
    );
    if (!poolItem) break;
    const targetDimension =
      mode === "surprise"
        ? ((poolItem.fitDimensions.find((item) =>
            ["user_problem", "evidence_use", "metric_validity", "ai_system_awareness", "rollout_judgment"].includes(item),
          ) ?? plan.targetDimension) as Dimension)
        : plan.targetDimension;

    try {
      const result = await generateAndVerifyCase(poolItemToCandidate(poolItem), {
        targetDimension,
        difficulty: plan.difficulty,
      });
    const createdAt = result.verification.verifiedAt;
    await db
      .insert(generatedCases)
      .values({
        id: crypto.randomUUID(),
        caseId: result.publicCase.caseId,
        ownerId: auth.user.userId,
        sourceItemId: poolItem.sourceItemId,
        status: "active",
        publicCase: result.publicCase,
        reveal: result.reveal,
        review: result.verification.review,
        sourceQuotes: result.verification.sourceQuotes,
        generatorVersion: result.verification.generator,
        reviewerVersion: result.verification.review.reviewer,
        createdAt,
      })
      .onConflictDoUpdate({
        target: [generatedCases.ownerId, generatedCases.sourceItemId],
        set: {
          status: "active",
          publicCase: result.publicCase,
          reveal: result.reveal,
          review: result.verification.review,
          sourceQuotes: result.verification.sourceQuotes,
          generatorVersion: result.verification.generator,
          reviewerVersion: result.verification.review.reviewer,
          createdAt,
        },
      });
    await setPoolItemStatus(auth.user.userId, poolItem.sourceItemId, "active", {
      selectedAt: poolItem.selectedAt ?? createdAt,
      failureClass: null,
    });
    await db.insert(sourceIngestionRuns).values({
      id: crypto.randomUUID(),
      ownerId: auth.user.userId,
      status: "random_case_verification_passed",
      itemCount: 1,
      candidates: [{ id: poolItem.sourceItemId, caseId: result.publicCase.caseId }],
      fetchedAt: createdAt,
    });
      return Response.json(
        {
          status: "auto_verified",
          caseData: result.publicCase,
          reviewer: result.verification.review.reviewer,
          practicePlan: { ...plan, targetDimension },
          replacementsTried: replacement,
        },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      const known = error instanceof AutomaticCaseError ? error : null;
      const errorClass = known?.code ?? "pipeline_failed";
      lastErrorClass = errorClass;
      await setPoolItemStatus(auth.user.userId, poolItem.sourceItemId, "rejected", {
        failureClass: errorClass,
      });
      await db.insert(sourceIngestionRuns).values({
        id: crypto.randomUUID(),
        ownerId: auth.user.userId,
        status: "candidate_replaced_after_verification_failure",
        itemCount: 1,
        candidates: [{ anonymousCandidate: replacement + 1 }],
        fetchedAt: new Date().toISOString(),
        errorClass,
      });
    }
  }
  return Response.json(
    {
      error:
        lastErrorClass === "pool_exhausted"
          ? `No unseen product currently supports ${plan.targetDimension.replaceAll("_", " ")}. Try Surprise me or sync again later.`
          : "Three candidates could not pass source and case-quality checks. Nothing was assigned or scored.",
      code: lastErrorClass,
    },
    { status: lastErrorClass === "pool_exhausted" ? 409 : 422 },
  );
}
