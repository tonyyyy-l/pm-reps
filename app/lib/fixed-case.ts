export type CaseChoice = {
  choiceId: string;
  label: string;
};

export type CasePrompt = {
  promptId: string;
  dimension:
    | "user_problem"
    | "evidence_use"
    | "metric_validity"
    | "ai_system_awareness"
    | "rollout_judgment";
  question: string;
  choices: CaseChoice[];
  rationaleRequired: true;
};

export type CaseResponse = {
  promptId: string;
  selectedChoiceId: string;
  rationale: string;
};

export type PublicCase = {
  schemaVersion: "case-public.v1";
  caseId: string;
  estimatedMinutes: number;
  decisionType: "product_priority";
  scenario: string;
  evidence: Array<{
    evidenceId: string;
    kind: "fact" | "metric" | "constraint";
    text: string;
  }>;
  constraints: string[];
  prompts: CasePrompt[];
};

export const fixedPublicCase: PublicCase = {
  schemaVersion: "case-public.v1",
  caseId: "fixed-agent-workspace-001",
  estimatedMinutes: 8,
  decisionType: "product_priority",
  scenario:
    "A mature AI coding agent is moving beyond short, single-task sessions. Professional developers now ask it to handle longer-running work across several repositories, but the terminal and editor make parallel tasks hard to supervise. You own the next product surface.",
  evidence: [
    {
      evidenceId: "evidence-01",
      kind: "fact",
      text: "Agent tasks are becoming longer-running and more complex.",
    },
    {
      evidenceId: "evidence-02",
      kind: "fact",
      text: "Developers increasingly coordinate several tasks and projects at once.",
    },
    {
      evidenceId: "evidence-03",
      kind: "fact",
      text: "Existing terminal and editor workflows create context switching and supervision friction.",
    },
    {
      evidenceId: "evidence-04",
      kind: "constraint",
      text: "Parallel code changes need isolation so agents do not overwrite one another.",
    },
    {
      evidenceId: "evidence-05",
      kind: "constraint",
      text: "Repository access, network access, and elevated actions require explicit safety controls.",
    },
  ],
  constraints: [
    "The first release must complement existing terminal and editor workflows.",
    "The team can launch one focused surface before expanding platform coverage.",
    "No trustworthy historical adoption metric is available for this new workflow.",
  ],
  prompts: [
    {
      promptId: "prompt-user",
      dimension: "user_problem",
      question: "Who should the first version serve most directly?",
      choices: [
        {
          choiceId: "user-professional",
          label: "Professional developers supervising several concurrent repository tasks",
        },
        {
          choiceId: "user-learner",
          label: "New programmers learning how to write their first functions",
        },
        {
          choiceId: "user-manager",
          label: "Engineering managers reading team-level productivity reports",
        },
      ],
      rationaleRequired: true,
    },
    {
      promptId: "prompt-priority",
      dimension: "evidence_use",
      question: "Which product bet best addresses the evidence in this case?",
      choices: [
        {
          choiceId: "priority-workspace",
          label: "A desktop command center for isolated, parallel agent work",
        },
        {
          choiceId: "priority-autocomplete",
          label: "Faster inline autocomplete inside the existing editor",
        },
        {
          choiceId: "priority-gallery",
          label: "A public gallery for sharing generated code snippets",
        },
      ],
      rationaleRequired: true,
    },
    {
      promptId: "prompt-metric",
      dimension: "metric_validity",
      question: "Which primary metric would best test whether the new surface creates durable value?",
      choices: [
        {
          choiceId: "metric-accepted",
          label: "Weekly completed agent tasks accepted after developer review",
        },
        {
          choiceId: "metric-started",
          label: "Number of agent tasks started per active user",
        },
        {
          choiceId: "metric-messages",
          label: "Average messages sent in each agent thread",
        },
      ],
      rationaleRequired: true,
    },
    {
      promptId: "prompt-rollout",
      dimension: "rollout_judgment",
      question: "How should the team introduce the first release?",
      choices: [
        {
          choiceId: "rollout-staged",
          label: "A staged desktop release to existing agent users with sandboxed defaults",
        },
        {
          choiceId: "rollout-broad",
          label: "An immediate public launch across every operating system",
        },
        {
          choiceId: "rollout-unrestricted",
          label: "Always-on background agents with unrestricted network and repository access",
        },
      ],
      rationaleRequired: true,
    },
  ],
};

export function validateCompleteResponses(
  responses: unknown,
): responses is CaseResponse[] {
  if (!Array.isArray(responses) || responses.length !== fixedPublicCase.prompts.length) {
    return false;
  }

  const responseByPrompt = new Map(
    responses
      .filter((response): response is CaseResponse => {
        if (!response || typeof response !== "object") return false;
        const candidate = response as Partial<CaseResponse>;
        return (
          typeof candidate.promptId === "string" &&
          typeof candidate.selectedChoiceId === "string" &&
          typeof candidate.rationale === "string" &&
          candidate.rationale.trim().length > 0
        );
      })
      .map((response) => [response.promptId, response]),
  );

  return fixedPublicCase.prompts.every((prompt) => {
    const response = responseByPrompt.get(prompt.promptId);
    return (
      response !== undefined &&
      prompt.choices.some(
        (choice) => choice.choiceId === response.selectedChoiceId,
      )
    );
  });
}
