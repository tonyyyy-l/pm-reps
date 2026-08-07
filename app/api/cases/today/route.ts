import { ensureSchema } from "@/db/ensure-schema";
import { getTodayCaseForOwner } from "@/app/lib/cases.server";
import { requireRequestUser } from "@/app/lib/request-user";

export async function GET(request: Request) {
  const auth = requireRequestUser(request);
  if (!auth.user) return auth.response;
  await ensureSchema();
  const bundle = await getTodayCaseForOwner(auth.user.userId);
  return Response.json(
    { caseData: bundle.publicCase },
    { headers: { "Cache-Control": "no-store" } },
  );
}
