import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts, evaluationDisputes } from "@/db/schema";
import { getCaseBundleForOwner } from "@/app/lib/cases.server";
import { requireRequestUser } from "@/app/lib/request-user";

export async function GET(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  const { attemptId } = await context.params;
  const [attempt] = await getDb()
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, auth.user.userId)))
    .limit(1);
  if (!attempt) return Response.json({ error: "Attempt not found." }, { status: 404 });
  const bundle = await getCaseBundleForOwner(auth.user.userId, attempt.caseId);
  if (!bundle) return Response.json({ error: "Case not found." }, { status: 404 });

  const disputes = await getDb()
    .select()
    .from(evaluationDisputes)
    .where(
      and(
        eq(evaluationDisputes.attemptId, attemptId),
        eq(evaluationDisputes.ownerId, auth.user.userId),
        eq(evaluationDisputes.status, "active"),
      ),
    );

  return Response.json(
    { attempt, caseData: bundle.publicCase, reveal: bundle.reveal, disputes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
