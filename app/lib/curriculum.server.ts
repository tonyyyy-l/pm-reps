import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { attempts, evaluationDisputes, skillObservations } from "@/db/schema";
import { dimensions, type Dimension, type Rating } from "./evaluation";
import type { CaseDifficulty } from "./fixed-case";

export type PracticeMode = "targeted" | "surprise";

export type PracticePlan = {
  mode: PracticeMode;
  targetDimension: Dimension;
  difficulty: CaseDifficulty;
  calibration: { completed: number; required: 5; complete: boolean };
  reason: string;
};

const ratingValue: Record<Rating, number> = {
  missing: 0,
  partial: 1,
  supported: 2,
  strong: 3,
};

export async function getPracticePlan(
  ownerId: string,
  mode: PracticeMode = "targeted",
): Promise<PracticePlan> {
  const db = getDb();
  const [completedAttempts, observations, disputes] = await Promise.all([
    db
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(eq(attempts.ownerId, ownerId), eq(attempts.status, "completed"))),
    db
      .select()
      .from(skillObservations)
      .where(
        and(
          eq(skillObservations.ownerId, ownerId),
          eq(skillObservations.signalType, "first_pass"),
        ),
      )
      .orderBy(asc(skillObservations.createdAt)),
    db
      .select({ attemptId: evaluationDisputes.attemptId, dimension: evaluationDisputes.dimension })
      .from(evaluationDisputes)
      .where(
        and(
          eq(evaluationDisputes.ownerId, ownerId),
          eq(evaluationDisputes.status, "active"),
        ),
      ),
  ]);
  const completed = completedAttempts.length;
  const calibrationComplete = completed >= 5;
  if (mode === "surprise") {
    const targetDimension = dimensions[randomIndex(dimensions.length)];
    return {
      mode,
      targetDimension,
      difficulty: calibrationComplete ? "trade_off" : "structured",
      calibration: { completed: Math.min(completed, 5), required: 5, complete: calibrationComplete },
      reason: "Surprise mode samples outside the weakness-targeted queue.",
    };
  }

  const disputedKeys = new Set(disputes.map((item) => `${item.attemptId}:${item.dimension}`));
  const trusted = observations.filter(
    (item) =>
      item.confidence !== "low" &&
      !disputedKeys.has(`${item.attemptId}:${item.dimension}`),
  );
  const stats = dimensions.map((dimension) => {
    const rows = trusted.filter((item) => item.dimension === dimension);
    return {
      dimension,
      count: rows.length,
      average: rows.length
        ? rows.reduce((sum, row) => sum + ratingValue[row.rating as Rating], 0) /
          rows.length
        : null,
    };
  });

  if (!calibrationComplete) {
    const leastCovered = [...stats].sort(
      (left, right) =>
        left.count - right.count ||
        dimensions.indexOf(left.dimension) - dimensions.indexOf(right.dimension),
    )[0];
    return {
      mode,
      targetDimension: leastCovered.dimension,
      difficulty: completed < 3 ? "structured" : "trade_off",
      calibration: { completed, required: 5, complete: false },
      reason: "Calibration balances coverage across all five judgment dimensions.",
    };
  }

  const repeated = stats.filter((item) => item.count >= 2 && item.average !== null);
  const weakest = [...repeated].sort(
    (left, right) =>
      (left.average ?? 99) - (right.average ?? 99) || left.count - right.count,
  )[0];
  const target =
    weakest ?? [...stats].sort((left, right) => left.count - right.count)[0];
  const difficulty: CaseDifficulty =
    target.count >= 3 && (target.average ?? 0) >= 2.4
      ? "ambiguous"
      : "trade_off";
  return {
    mode,
    targetDimension: target.dimension,
    difficulty,
    calibration: { completed: 5, required: 5, complete: true },
    reason: weakest
      ? "First-pass observations identify this as the clearest repeated practice need."
      : "There is not enough repeated evidence yet, so routing balances coverage.",
  };
}

function randomIndex(length: number) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % length;
}
