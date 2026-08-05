import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { decisionCards } from "@/db/schema";
import {
  rejectCrossOrigin,
  requireRequestUser,
} from "@/app/lib/request-user";

export async function POST(
  request: Request,
  context: { params: Promise<{ cardId: string }> },
) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  const { cardId } = await context.params;
  const db = getDb();
  const [card] = await db
    .select()
    .from(decisionCards)
    .where(and(eq(decisionCards.id, cardId), eq(decisionCards.ownerId, auth.user.userId)))
    .limit(1);
  if (!card) return Response.json({ error: "Decision Card not found." }, { status: 404 });
  await db
    .update(decisionCards)
    .set({ status: "private", publishedAt: null })
    .where(and(eq(decisionCards.id, cardId), eq(decisionCards.ownerId, auth.user.userId)));
  return Response.json({ card: { ...card, status: "private", publishedAt: null } });
}
