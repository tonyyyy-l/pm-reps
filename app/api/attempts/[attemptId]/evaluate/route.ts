import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts } from "@/db/schema";
import { evaluateAttempt } from "@/app/lib/evaluation";
import { getCaseBundleForOwner } from "@/app/lib/cases.server";
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
  await ensureSchema();
  const { attemptId } = await context.params;
  const db = getDb();
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)))
    .limit(1);
  if (!attempt) return Response.json({ error: "Attempt not found." }, { status: 404 });
  if (attempt.evaluation) {
    return Response.json({ evaluation: attempt.evaluation, mode: attempt.evaluatorMode });
  }
  if (!["committed", "evaluation_failed"].includes(attempt.status)) {
    return Response.json({ error: "Attempt is not ready for evaluation." }, { status: 409 });
  }
  const bundle = await getCaseBundleForOwner(auth.user.userId, attempt.caseId);
  if (!bundle) return Response.json({ error: "Case not found." }, { status: 404 });

  try {
    const result = await evaluateAttempt({
      attemptId,
      responses: attempt.originalResponses,
      caseData: bundle.publicCase,
      reveal: bundle.reveal,
    });
    await db
      .update(attempts)
      .set({
        status: "feedback_ready",
        evaluation: result.evaluation,
        evaluatorMode: result.mode,
      })
      .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)));
    return Response.json(result);
  } catch {
    await db
      .update(attempts)
      .set({ status: "evaluation_failed" })
      .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)));
    return Response.json(
      {
        error:
          "Evaluation is temporarily unavailable. No feedback, skill progress, or public content was created.",
      },
      { status: 503 },
    );
  }
}
