import { fixedPublicCase, type CaseResponse } from "./fixed-case";
import type { FixedCaseReveal } from "./fixed-case-reveal.server";

export type DecisionCardSnapshot = {
  schemaVersion: "decision-card-public.v1";
  slug: string;
  publishedAt: string;
  displayName: string;
  case: {
    title: string;
    decisionType: "product_priority";
  };
  decision: {
    summary: string;
    reasoning: string;
    assumptions: string[];
  };
  revisionSummary: string;
  source: FixedCaseReveal["source"];
};

export function createDecisionCardSnapshot(input: {
  slug: string;
  displayName: string;
  originalResponses: CaseResponse[];
  revisionResponses: CaseResponse[];
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
      title: "Designing a command center for parallel AI agent work",
      decisionType: "product_priority",
    },
    decision: {
      summary: input.revisionResponses
        .map((response) => {
          const prompt = fixedPublicCase.prompts.find(
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
        "The first release should complement existing terminal and editor workflows.",
        "Safety controls and isolated changes are necessary for parallel agent work.",
      ],
    },
    revisionSummary:
      changedCount === 0
        ? "I kept my original decisions after reviewing the feedback and documented why."
        : `I changed ${changedCount} of four decisions or rationales after reviewing evidence-linked feedback.`,
    source: input.reveal.source,
  };
}
