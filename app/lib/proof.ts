import type { CaseResponse, PublicCase } from "./fixed-case";
import type { FixedCaseReveal } from "./fixed-case-reveal.server";

export type DecisionCardSnapshot = {
  schemaVersion: "decision-card-public.v1";
  slug: string;
  publishedAt: string;
  displayName: string;
  case: {
    title: string;
    decisionType: PublicCase["decisionType"];
  };
  decision: {
    summary: string;
    reasoning: string;
    assumptions: string[];
  };
  revisionSummary: string;
  comparison: {
    whatCompanyChoseOrShipped: string;
    note: string;
  };
  source: FixedCaseReveal["source"];
};

export function createDecisionCardSnapshot(input: {
  slug: string;
  displayName: string;
  originalResponses: CaseResponse[];
  revisionResponses: CaseResponse[];
  caseData: PublicCase;
  reveal: FixedCaseReveal;
  publishedAt?: string;
}): DecisionCardSnapshot {
  const changedCount = input.revisionResponses.filter((revision, index) => {
    const original = input.originalResponses[index];
    return (
      original?.selectedChoiceId !== revision.selectedChoiceId ||
      original?.rationale !== revision.rationale
    );
  }).length;

  return {
    schemaVersion: "decision-card-public.v1",
    slug: input.slug,
    publishedAt: input.publishedAt ?? "1970-01-01T00:00:00.000Z",
    displayName: input.displayName,
    case: {
      title: input.caseData.scenario,
      decisionType: input.caseData.decisionType,
    },
    decision: {
      summary: input.revisionResponses
        .map((response) => {
          const prompt = input.caseData.prompts.find(
            (item) => item.promptId === response.promptId,
          );
          return prompt?.choices.find(
            (choice) => choice.choiceId === response.selectedChoiceId,
          )?.label;
        })
        .filter(Boolean)
        .join(" · "),
      reasoning: input.revisionResponses
        .map((response) => response.rationale)
        .join("\n\n"),
      assumptions: [
        ...input.caseData.constraints.slice(0, 3),
      ],
    },
    revisionSummary:
      changedCount === 0
        ? "I kept my original decisions after reviewing the feedback and documented why."
        : `I changed ${changedCount} of ${input.caseData.prompts.length} decisions or rationales after reviewing evidence-linked feedback.`,
    comparison: {
      whatCompanyChoseOrShipped: input.reveal.whatShipped,
      note: "The company choice is a comparison point, not an answer key.",
    },
    source: input.reveal.source,
  };
}
