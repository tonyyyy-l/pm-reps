import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { generatedCases } from "@/db/schema";
import { fixedPublicCase, type PublicCase } from "./fixed-case";
import { fixedCaseReveal, type FixedCaseReveal } from "./fixed-case-reveal.server";

export type CaseBundle = { publicCase: PublicCase; reveal: FixedCaseReveal };

export async function getCaseBundleForOwner(
  ownerId: string,
  caseId: string,
): Promise<CaseBundle | null> {
  if (caseId === fixedPublicCase.caseId) {
    return { publicCase: fixedPublicCase, reveal: fixedCaseReveal };
  }
  const [row] = await getDb()
    .select({ publicCase: generatedCases.publicCase, reveal: generatedCases.reveal })
    .from(generatedCases)
    .where(and(eq(generatedCases.caseId, caseId), eq(generatedCases.ownerId, ownerId)))
    .limit(1);
  return row ? normalizeStoredBundle(row) : null;
}

export async function getTodayCaseForOwner(ownerId: string): Promise<CaseBundle> {
  const [row] = await getDb()
    .select({ publicCase: generatedCases.publicCase, reveal: generatedCases.reveal })
    .from(generatedCases)
    .where(and(eq(generatedCases.ownerId, ownerId), eq(generatedCases.status, "active")))
    .orderBy(desc(generatedCases.createdAt))
    .limit(1);
  return row
    ? normalizeStoredBundle(row)
    : { publicCase: fixedPublicCase, reveal: fixedCaseReveal };
}

function normalizeStoredBundle(row: {
  publicCase: PublicCase;
  reveal: FixedCaseReveal;
}): CaseBundle {
  const storedCase = row.publicCase as PublicCase & {
    schemaVersion?: string;
    targetDimension?: PublicCase["targetDimension"];
    difficulty?: PublicCase["difficulty"];
    corePromptId?: string;
    evidence: Array<PublicCase["evidence"][number] & { status?: "fact" | "inference" }>;
  };
  const corePrompt =
    storedCase.prompts.find((prompt) => prompt.promptId === storedCase.corePromptId) ??
    storedCase.prompts[0];
  const publicCase: PublicCase = {
    ...storedCase,
    schemaVersion: "case-public.v2",
    targetDimension: storedCase.targetDimension ?? corePrompt.dimension,
    difficulty: storedCase.difficulty ?? "structured",
    corePromptId: storedCase.corePromptId ?? corePrompt.promptId,
    evidence: storedCase.evidence.map((item) => {
      const legacy = item as typeof item & { status?: "fact" | "inference" };
      return {
        evidenceId: item.evidenceId,
        category: item.category,
        provenance:
          item.provenance ??
          (legacy.status === "inference" ? "inference" : "shipped_fact"),
        text: item.text,
      };
    }),
    prompts: storedCase.prompts.map((prompt) => ({
      ...prompt,
      initialDirectionRequired:
        prompt.initialDirectionRequired ?? prompt.promptId === (storedCase.corePromptId ?? corePrompt.promptId),
    })),
  };
  const storedReveal = row.reveal as FixedCaseReveal & {
    schemaVersion?: string;
    realOutcome?: string;
    evidenceCommentary: Array<FixedCaseReveal["evidenceCommentary"][number] & { classification?: "fact" | "inference" }>;
  };
  const reveal: FixedCaseReveal = {
    ...storedReveal,
    schemaVersion: "case-reveal.v2",
    whatShipped: storedReveal.whatShipped ?? storedReveal.realOutcome ?? "Company choice unavailable.",
    evidenceCommentary: storedReveal.evidenceCommentary.map((item) => {
      const legacy = item as typeof item & {
        classification?: "fact" | "inference";
      };
      return {
        evidenceId: item.evidenceId,
        provenance:
          item.provenance ??
          (legacy.classification === "inference" ? "inference" : "shipped_fact"),
        text: item.text,
      };
    }),
  };
  return { publicCase, reveal };
}
