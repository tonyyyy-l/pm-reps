import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts, decisionCards, skillObservations } from "@/db/schema";
import { fixedCaseReveal } from "@/app/lib/fixed-case-reveal.server";
import { validateCompleteResponses } from "@/app/lib/fixed-case";
import { createDecisionCardSnapshot } from "@/app/lib/proof";
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
  if (!validateCompleteResponses(body.revisionResponses)) {
    return Response.json(
      { error: "Complete all four revised decisions and rationales." },
      { status: 400 },
    );
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
  if (!attempt.evaluation || !["feedback_ready", "completed"].includes(attempt.status)) {
    return Response.json(
      { error: "Valid feedback is required before revision." },
      { status: 409 },
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
    revisionResponses: body.revisionResponses,
    reveal: fixedCaseReveal,
  });

  await db
    .update(attempts)
    .set({
      status: "completed",
      revisionResponses: body.revisionResponses,
      completedAt: now,
    })
    .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)));

  await db
    .insert(skillObservations)
    .values(
      attempt.evaluation.dimensions.map((dimension) => ({
        id: crypto.randomUUID(),
        ownerId: auth.user.userId,
        attemptId,
        dimension: dimension.dimension,
        rating: dimension.rating,
        rationale: dimension.rationale,
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

  return Response.json({
    attempt: {
      attemptId,
      status: "completed",
      completedAt: now,
      originalResponses: attempt.originalResponses,
      revisionResponses: body.revisionResponses,
    },
    card: { id: cardId, status: "private", snapshot },
  });
}
