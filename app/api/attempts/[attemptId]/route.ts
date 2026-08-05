import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts } from "@/db/schema";
import { fixedPublicCase } from "@/app/lib/fixed-case";
import { fixedCaseReveal } from "@/app/lib/fixed-case-reveal.server";
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

  return Response.json(
    { attempt, caseData: fixedPublicCase, reveal: fixedCaseReveal },
    { headers: { "Cache-Control": "no-store" } },
  );
}
