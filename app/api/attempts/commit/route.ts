import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts } from "@/db/schema";
import {
  fixedPublicCase,
  validateCompleteResponses,
} from "@/app/lib/fixed-case";
import { fixedCaseReveal } from "@/app/lib/fixed-case-reveal.server";
import {
  rejectCrossOrigin,
  requireRequestUser,
} from "@/app/lib/request-user";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;

  let body: { caseId?: string; originalResponses?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Commitment must be valid JSON." }, { status: 400 });
  }
  if (
    body.caseId !== fixedPublicCase.caseId ||
    !validateCompleteResponses(body.originalResponses)
  ) {
    return Response.json(
      { error: "Complete all four decisions and rationales before committing." },
      { status: 400 },
    );
  }

  await ensureSchema();
  const now = new Date().toISOString();
  const attemptId = crypto.randomUUID();
  await getDb().insert(attempts).values({
    id: attemptId,
    ownerId: auth.user.userId,
    caseId: fixedPublicCase.caseId,
    status: "committed",
    startedAt: now,
    committedAt: now,
    originalResponses: body.originalResponses.map((response) => ({ ...response })),
  });

  return Response.json(
    {
      attempt: {
        attemptId,
        status: "committed",
        committedAt: now,
        originalResponses: body.originalResponses,
      },
      reveal: fixedCaseReveal,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
