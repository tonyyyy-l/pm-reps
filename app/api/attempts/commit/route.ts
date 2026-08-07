import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts } from "@/db/schema";
import {
  validateCompleteResponses,
} from "@/app/lib/fixed-case";
import { getCaseBundleForOwner } from "@/app/lib/cases.server";
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
  if (typeof body.caseId !== "string") {
    return Response.json(
      { error: "Complete every decision, initial direction, and rationale before committing." },
      { status: 400 },
    );
  }

  await ensureSchema();
  const bundle = await getCaseBundleForOwner(auth.user.userId, body.caseId);
  if (!bundle) return Response.json({ error: "Case not found." }, { status: 404 });
  if (!validateCompleteResponses(body.originalResponses, bundle.publicCase)) {
    return Response.json(
      { error: "Complete every decision, initial direction, and rationale before committing." },
      { status: 400 },
    );
  }
  const now = new Date().toISOString();
  const attemptId = crypto.randomUUID();
  await getDb().insert(attempts).values({
    id: attemptId,
    ownerId: auth.user.userId,
    caseId: bundle.publicCase.caseId,
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
      reveal: bundle.reveal,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
