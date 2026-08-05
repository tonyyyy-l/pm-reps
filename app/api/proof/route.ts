import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { decisionCards } from "@/db/schema";
import { requireRequestUser } from "@/app/lib/request-user";

export async function GET(request: Request) {
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  const [card] = await getDb()
    .select()
    .from(decisionCards)
    .where(eq(decisionCards.ownerId, auth.user.userId))
    .orderBy(desc(decisionCards.createdAt))
    .limit(1);
  return Response.json({ card: card ?? null }, { headers: { "Cache-Control": "no-store" } });
}
