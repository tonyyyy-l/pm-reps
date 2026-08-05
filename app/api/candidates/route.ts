import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { sourceIngestionRuns } from "@/db/schema";
import { requireRequestUser } from "@/app/lib/request-user";

type Candidate = {
  id: string;
  title: string;
  summary: string | null;
  category: "ai-products";
  publishedAt: string | null;
  permalink: string;
};

const AI_HOT_URL =
  "https://aihot.virxact.com/api/public/items?mode=selected&category=ai-products&take=8";
const AI_HOT_UA = "aihot-skill/0.3.7 (+https://aihot.virxact.com/aihot-skill/)";

export async function GET(request: Request) {
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  try {
    const response = await fetch(AI_HOT_URL, {
      headers: { "User-Agent": AI_HOT_UA },
    });
    if (!response.ok) throw new Error(`status_${response.status}`);
    const payload = (await response.json()) as { items?: unknown[] };
    const candidates = (payload.items ?? [])
      .map(parseCandidate)
      .filter((candidate): candidate is Candidate => candidate !== null);
    const fetchedAt = new Date().toISOString();
    await getDb().insert(sourceIngestionRuns).values({
      id: crypto.randomUUID(),
      ownerId: auth.user.userId,
      status: "candidate_review",
      itemCount: candidates.length,
      candidates,
      fetchedAt,
    });
    return Response.json(
      {
        candidates,
        fetchedAt,
        source: {
          name: "AI HOT",
          canonical: "https://aihot.virxact.com/",
        },
        reviewStatus: "Human source verification required before case activation.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "AI HOT is temporarily unavailable. No candidate was invented or backfilled.",
      },
      { status: 503 },
    );
  }
}

function parseCandidate(value: unknown): Candidate | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    item.category !== "ai-products" ||
    typeof item.permalink !== "string" ||
    !item.permalink.startsWith("https://aihot.virxact.com/")
  ) {
    return null;
  }
  return {
    id: item.id,
    title: item.title.slice(0, 300),
    summary: typeof item.summary === "string" ? item.summary.slice(0, 800) : null,
    category: "ai-products",
    publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : null,
    permalink: item.permalink,
  };
}
