import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { decisionCards } from "@/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  await ensureSchema();
  const { slug } = await context.params;
  const [card] = await getDb()
    .select({ snapshot: decisionCards.snapshot })
    .from(decisionCards)
    .where(and(eq(decisionCards.slug, slug), eq(decisionCards.status, "published")))
    .limit(1);
  if (!card) return Response.json({ error: "Decision Card not found." }, { status: 404 });
  return Response.json(card.snapshot, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
