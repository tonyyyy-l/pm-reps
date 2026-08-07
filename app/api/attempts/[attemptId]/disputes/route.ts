import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts, evaluationDisputes } from "@/db/schema";
import { dimensions, type Dimension } from "@/app/lib/evaluation";
import { rejectCrossOrigin, requireRequestUser } from "@/app/lib/request-user";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  let body: { dimension?: Dimension; reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Dispute must be valid JSON." }, { status: 400 });
  }
  if (!body.dimension || !dimensions.includes(body.dimension)) {
    return Response.json({ error: "Choose a valid evaluation dimension." }, { status: 400 });
  }
  if (body.reason && body.reason.length > 800) {
    return Response.json({ error: "Dispute reason is too long." }, { status: 400 });
  }
  await ensureSchema();
  const { attemptId } = await context.params;
  const db = getDb();
  const [attempt] = await db
    .select({ id: attempts.id, evaluation: attempts.evaluation })
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)))
    .limit(1);
  if (!attempt?.evaluation?.dimensions.some((item) => item.dimension === body.dimension)) {
    return Response.json({ error: "Evaluated dimension not found." }, { status: 404 });
  }
  const createdAt = new Date().toISOString();
  await db
    .insert(evaluationDisputes)
    .values({
      id: crypto.randomUUID(),
      ownerId: auth.user.userId,
      attemptId,
      dimension: body.dimension,
      reason: body.reason?.trim() || null,
      status: "active",
      createdAt,
    })
    .onConflictDoUpdate({
      target: [evaluationDisputes.attemptId, evaluationDisputes.dimension],
      set: { reason: body.reason?.trim() || null, status: "active", createdAt },
    });
  return Response.json({ dispute: { attemptId, dimension: body.dimension, status: "active", createdAt } }, { status: 201 });
}
