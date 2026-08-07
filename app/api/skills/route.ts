import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts, evaluationDisputes, skillObservations } from "@/db/schema";
import { dimensions, type Dimension, type Rating } from "@/app/lib/evaluation";
import { getPracticePlan } from "@/app/lib/curriculum.server";
import { requireRequestUser } from "@/app/lib/request-user";

const ratingValue: Record<Rating, number> = {
  missing: 0,
  partial: 1,
  supported: 2,
  strong: 3,
};

export async function GET(request: Request) {
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  const db = getDb();
  const [rows, disputes, completedAttempts, practicePlan] = await Promise.all([
    db
      .select()
      .from(skillObservations)
      .where(eq(skillObservations.ownerId, auth.user.userId))
      .orderBy(asc(skillObservations.createdAt)),
    db
      .select({ attemptId: evaluationDisputes.attemptId, dimension: evaluationDisputes.dimension })
      .from(evaluationDisputes)
      .where(
        and(
          eq(evaluationDisputes.ownerId, auth.user.userId),
          eq(evaluationDisputes.status, "active"),
        ),
      ),
    db
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(eq(attempts.ownerId, auth.user.userId), eq(attempts.status, "completed"))),
    getPracticePlan(auth.user.userId),
  ]);
  const disputed = new Set(disputes.map((item) => `${item.attemptId}:${item.dimension}`));

  const patterns = dimensions.map((dimension) => ({
    dimension: dimension as Dimension,
    firstPass: summarizeSignal(rows, disputed, dimension, "first_pass"),
    revisionResponse: summarizeSignal(rows, disputed, dimension, "revision_response"),
  }));
  const completedReps = completedAttempts.length;
  return Response.json({
    patterns,
    completedReps,
    calibration: {
      completed: Math.min(completedReps, 5),
      required: 5,
      complete: completedReps >= 5,
      label: completedReps >= 5 ? "Calibration complete" : "Early signals",
    },
    disputedObservations: disputes.length,
    suggestedNext: practicePlan,
  });
}

function summarizeSignal(
  rows: Array<typeof skillObservations.$inferSelect>,
  disputed: Set<string>,
  dimension: Dimension,
  signalType: "first_pass" | "revision_response",
) {
  const all = rows.filter(
    (row) => row.dimension === dimension && row.signalType === signalType,
  );
  const eligible = all.filter(
    (row) =>
      row.confidence !== "low" &&
      !disputed.has(`${row.attemptId}:${row.dimension}`),
  );
  const average = eligible.length
    ? eligible.reduce(
        (sum, observation) => sum + ratingValue[observation.rating as Rating],
        0,
      ) / eligible.length
    : null;
  const latest = all.at(-1);
  return {
    observationCount: all.length,
    eligibleCount: eligible.length,
    excludedCount: all.length - eligible.length,
    pattern:
      average === null
        ? "No trusted evidence yet"
        : average >= 2.5
          ? "Consistent strength"
          : average >= 1.5
            ? "Developing"
            : "Practice next",
    latestRating: (latest?.rating as Rating | undefined) ?? null,
    latestRationale: latest?.rationale ?? null,
    latestConfidence: latest?.confidence ?? null,
    latestDifficulty: latest?.difficulty ?? null,
  };
}
