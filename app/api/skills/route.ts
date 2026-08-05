import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { skillObservations } from "@/db/schema";
import { dimensions, type Dimension, type Rating } from "@/app/lib/evaluation";
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
  const rows = await getDb()
    .select()
    .from(skillObservations)
    .where(eq(skillObservations.ownerId, auth.user.userId))
    .orderBy(asc(skillObservations.createdAt));

  const patterns = dimensions.map((dimension) => {
    const observations = rows.filter((row) => row.dimension === dimension);
    const average = observations.length
      ? observations.reduce(
          (sum, observation) => sum + ratingValue[observation.rating as Rating],
          0,
        ) / observations.length
      : null;
    return {
      dimension: dimension as Dimension,
      completedReps: observations.length,
      pattern:
        average === null
          ? "No evidence yet"
          : average >= 2.5
            ? "Consistent strength"
            : average >= 1.5
              ? "Developing"
              : "Practice next",
      latestRating: (observations.at(-1)?.rating as Rating | undefined) ?? null,
      latestRationale: observations.at(-1)?.rationale ?? null,
    };
  });
  return Response.json({ patterns, completedReps: new Set(rows.map((row) => row.attemptId)).size });
}
