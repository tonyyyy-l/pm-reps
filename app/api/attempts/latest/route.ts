import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { attempts } from "@/db/schema";
import { requireRequestUser } from "@/app/lib/request-user";

export async function GET(request: Request) {
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  const [attempt] = await getDb()
    .select({ id: attempts.id, status: attempts.status, committedAt: attempts.committedAt })
    .from(attempts)
    .where(eq(attempts.ownerId, auth.user.userId))
    .orderBy(desc(attempts.committedAt))
    .limit(1);
  return Response.json({ attempt: attempt ?? null }, { headers: { "Cache-Control": "no-store" } });
}
