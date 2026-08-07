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
  initialDirectionRequired: boolean;
};

export type CaseResponse = {
  promptId: string;
  selectedChoiceId: string;
  rationale: string;
  initialDirection?: string;
};

export type CaseDifficulty = "structured" | "trade_off" | "ambiguous";
export type EvidenceProvenance =
  | "shipped_fact"
  | "company_reported"
  | "inference";

export type PublicCase = {
  schemaVersion: "case-public.v2";
  caseId: string;
  estimatedMinutes: number;
  decisionType: "product_priority";
  targetDimension: CasePrompt["dimension"];
  difficulty: CaseDifficulty;
  corePromptId: string;
  scenario: string;
  evidence: Array<{
    evidenceId: string;
    category:
      | "trend"
      | "behavior"
      | "pain"
      | "need"
      | "risk"
      | "metric"
      | "constraint";
    provenance: EvidenceProvenance;
    text: string;
  }>;
  constraints: string[];
  prompts: CasePrompt[];
};

export const fixedPublicCase: PublicCase = {
  schemaVersion: "case-public.v2",
  caseId: "fixed-agent-workspace-001",
  estimatedMinutes: 8,
  decisionType: "product_priority",
  targetDimension: "user_problem",
  difficulty: "structured",
  corePromptId: "prompt-user",
  scenario:
    "A mature AI coding agent is moving beyond short, single-task sessions. Professional developers now ask it to handle longer-running work across several repositories, but the terminal and editor make parallel tasks hard to supervise. You own the next product surface.",
  evidence: [
    {
      evidenceId: "evidence-01",
      category: "trend",
      provenance: "company_reported",
      text: "The company reports that agent tasks are becoming longer-running and more complex.",
    },
    {
      evidenceId: "evidence-02",
      category: "behavior",
      provenance: "inference",
      text: "Developers increasingly coordinate several tasks and projects at once.",
    },
    {
      evidenceId: "evidence-03",
      category: "pain",
      provenance: "company_reported",
      text: "The company reports that existing terminal and editor workflows create supervision friction.",
    },
    {
      evidenceId: "evidence-04",
      category: "need",
      provenance: "inference",
      text: "Parallel code changes need isolation so agents do not overwrite one another.",
    },
    {
      evidenceId: "evidence-05",
      category: "risk",
      provenance: "company_reported",
      text: "The company reports that repository, network, and elevated actions require explicit safety controls.",
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
          label: "Experienced developers actively supervising several concurrent repository tasks",
        },
        {
          choiceId: "user-platform-team",
          label: "Platform teams standardizing how developers delegate and review agent work",
        },
        {
          choiceId: "user-manager",
          label: "Hands-on engineering managers coordinating delivery across several repositories",
        },
      ],
      rationaleRequired: true,
      initialDirectionRequired: true,
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
          label: "An editor-native supervisor that keeps plans, diffs, and approvals in one repository view",
        },
        {
          choiceId: "priority-team-control",
          label: "A team control plane that assigns isolated agent work and centralizes review policy",
        },
      ],
      rationaleRequired: true,
      initialDirectionRequired: false,
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
          label: "Share of multi-agent sessions completed without manual context recovery",
        },
        {
          choiceId: "metric-messages",
          label: "Median time from delegated task start to a reviewed, merge-ready change",
        },
      ],
      rationaleRequired: true,
      initialDirectionRequired: false,
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
          label: "A broad beta for existing agent users with isolation required and team controls deferred",
        },
        {
          choiceId: "rollout-design-partner",
          label: "A design-partner pilot for teams with admin policy controls before an individual-user release",
        },
      ],
      rationaleRequired: true,
      initialDirectionRequired: false,
    },
  ],
};

export function validateCompleteResponses(
  responses: unknown,
  caseData: PublicCase = fixedPublicCase,
): responses is CaseResponse[] {
  if (!Array.isArray(responses) || responses.length !== caseData.prompts.length) {
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
          candidate.rationale.trim().length > 0 &&
          (candidate.initialDirection === undefined ||
            typeof candidate.initialDirection === "string")
        );
      })
      .map((response) => [response.promptId, response]),
  );

  return caseData.prompts.every((prompt) => {
    const response = responseByPrompt.get(prompt.promptId);
    return (
      response !== undefined &&
      (!prompt.initialDirectionRequired ||
        Boolean(response.initialDirection?.trim())) &&
      prompt.choices.some(
        (choice) => choice.choiceId === response.selectedChoiceId,
      )
    );
  });
}
