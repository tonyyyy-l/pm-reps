import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import {
  attempts,
  candidateProductPool,
  decisionCards,
  generatedCases,
  skillObservations,
} from "@/db/schema";
import { validateCompleteResponses } from "@/app/lib/fixed-case";
import { createDecisionCardSnapshot } from "@/app/lib/proof";
import { getCaseBundleForOwner } from "@/app/lib/cases.server";
import { evaluateAttempt } from "@/app/lib/evaluation";
import {
  rejectCrossOrigin,
  requireRequestUser,
} from "@/app/lib/request-user";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  let body: { revisionResponses?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Revision must be valid JSON." }, { status: 400 });
  }
  await ensureSchema();
  const { attemptId } = await context.params;
  const db = getDb();
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)))
    .limit(1);
  if (!attempt) return Response.json({ error: "Attempt not found." }, { status: 404 });
  const bundle = await getCaseBundleForOwner(auth.user.userId, attempt.caseId);
  if (!bundle) return Response.json({ error: "Case not found." }, { status: 404 });
  if (!validateCompleteResponses(body.revisionResponses, bundle.publicCase)) {
    return Response.json(
      { error: "Complete every revised decision, initial direction, and rationale." },
      { status: 400 },
    );
  }
  if (!attempt.evaluation || !["feedback_ready", "completed"].includes(attempt.status)) {
    return Response.json(
      { error: "Valid feedback is required before revision." },
      { status: 409 },
    );
  }
  const revisionResponses = body.revisionResponses;
  const meaningfullyRevised = revisionResponses.some((revision, index) => {
    const original = attempt.originalResponses[index];
    return (
      original?.selectedChoiceId !== revision.selectedChoiceId ||
      original?.rationale.trim() !== revision.rationale.trim()
    );
  });
  if (!meaningfullyRevised) {
    return Response.json(
      { error: "Change a decision or strengthen at least one rationale before completing the rep." },
      { status: 400 },
    );
  }

  let revisionResult: Awaited<ReturnType<typeof evaluateAttempt>>;
  try {
    revisionResult = await evaluateAttempt({
      attemptId,
      responses: revisionResponses,
      caseData: bundle.publicCase,
      reveal: bundle.reveal,
    });
  } catch {
    return Response.json(
      { error: "Revision evaluation is temporarily unavailable. Your completed rep was not changed." },
      { status: 503 },
    );
  }

  const now = new Date().toISOString();
  const [existingCard] = await db
    .select()
    .from(decisionCards)
    .where(eq(decisionCards.attemptId, attemptId))
    .limit(1);
  const cardId = existingCard?.id ?? crypto.randomUUID();
  const slug = existingCard?.slug ?? `decision-${crypto.randomUUID().replaceAll("-", "")}`;
  if (existingCard?.status === "published") {
    return Response.json(
      { error: "Unpublish the current card before changing its snapshot." },
      { status: 409 },
    );
  }
  const snapshot = createDecisionCardSnapshot({
    slug,
    displayName: auth.user.displayName,
    originalResponses: attempt.originalResponses,
    revisionResponses,
    caseData: bundle.publicCase,
    reveal: bundle.reveal,
  });

  await db
    .update(attempts)
    .set({
      status: "completed",
      revisionResponses,
      revisionEvaluation: revisionResult.evaluation,
      revisionEvaluatorMode: revisionResult.mode,
      completedAt: now,
    })
    .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)));

  await db
    .insert(skillObservations)
    .values(
      [
        ...attempt.evaluation.dimensions.map((dimension) => ({
          dimension,
          signalType: "first_pass",
        })),
        ...revisionResult.evaluation.dimensions.map((dimension) => ({
          dimension,
          signalType: "revision_response",
        })),
      ].map(({ dimension, signalType }) => ({
        id: crypto.randomUUID(),
        ownerId: auth.user.userId,
        attemptId,
        dimension: dimension.dimension,
        rating: dimension.rating,
        rationale: dimension.rationale,
        signalType,
        confidence: dimension.confidence,
        difficulty: bundle.publicCase.difficulty,
        createdAt: now,
      })),
    )
    .onConflictDoNothing();

  if (existingCard) {
    await db
      .update(decisionCards)
      .set({ snapshot })
      .where(and(eq(decisionCards.id, cardId), eq(decisionCards.ownerId, auth.user.userId)));
  } else {
    await db.insert(decisionCards).values({
      id: cardId,
      ownerId: auth.user.userId,
      attemptId,
      slug,
      status: "private",
      snapshot,
      createdAt: now,
    });
  }

  const [generatedCase] = await db
    .select({ sourceItemId: generatedCases.sourceItemId })
    .from(generatedCases)
    .where(
      and(
        eq(generatedCases.ownerId, auth.user.userId),
        eq(generatedCases.caseId, attempt.caseId),
      ),
    )
    .limit(1);
  if (generatedCase) {
    await db
      .update(generatedCases)
      .set({ status: "completed" })
      .where(
        and(
          eq(generatedCases.ownerId, auth.user.userId),
          eq(generatedCases.caseId, attempt.caseId),
        ),
      );
    await db
      .update(candidateProductPool)
      .set({ status: "completed", completedAt: now, failureClass: null })
      .where(
        and(
          eq(candidateProductPool.ownerId, auth.user.userId),
          eq(candidateProductPool.sourceItemId, generatedCase.sourceItemId),
        ),
      );
  }

  return Response.json({
    attempt: {
      attemptId,
      status: "completed",
      completedAt: now,
      originalResponses: attempt.originalResponses,
      revisionResponses,
      revisionEvaluation: revisionResult.evaluation,
      revisionEvaluatorMode: revisionResult.mode,
    },
    card: { id: cardId, status: "private", snapshot },
  });
}
