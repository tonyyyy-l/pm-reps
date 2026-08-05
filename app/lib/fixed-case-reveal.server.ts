import type { CaseResponse } from "./fixed-case";

export type FixedCaseReveal = {
  schemaVersion: "case-reveal.v1";
  caseId: string;
  companyName: string;
  productName: string;
  source: {
    title: string;
    canonicalUrl: string;
    publishedAt: string;
    retrievedAt: string;
  };
  realOutcome: string;
  evidenceCommentary: Array<{
    evidenceId: string;
    classification: "fact" | "inference";
    text: string;
  }>;
  referenceTradeoffs: string[];
};

export type RevealRequest = {
  caseId: string;
  originalResponses: CaseResponse[];
};

export const fixedCaseReveal: FixedCaseReveal = {
  schemaVersion: "case-reveal.v1",
  caseId: "fixed-agent-workspace-001",
  companyName: "OpenAI",
  productName: "Codex app",
  source: {
    title: "Introducing the Codex app",
    canonicalUrl: "https://openai.com/index/introducing-the-codex-app/",
    publishedAt: "2026-02-02T00:00:00.000Z",
    retrievedAt: "2026-08-04T00:00:00.000Z",
  },
  realOutcome:
    "OpenAI launched a desktop command center for Codex agents. It organizes agent threads by project, lets users run work in parallel, uses worktrees to isolate changes, and adds review, skills, automations, and sandboxed permission controls. The first launch focused on macOS and existing Codex users before later platform expansion.",
  evidenceCommentary: [
    {
      evidenceId: "evidence-01",
      classification: "fact",
      text: "The launch explicitly framed agent work as longer-running and more complex.",
    },
    {
      evidenceId: "evidence-03",
      classification: "fact",
      text: "The source says existing IDEs and terminals were not designed for supervising multiple agents at scale.",
    },
    {
      evidenceId: "evidence-04",
      classification: "fact",
      text: "Built-in worktrees were used to keep parallel agent changes isolated.",
    },
    {
      evidenceId: "evidence-05",
      classification: "fact",
      text: "The product applied sandboxing by default and asked for permission before elevated or network actions.",
    },
  ],
  referenceTradeoffs: [
    "A focused desktop surface made multi-agent supervision clearer but narrowed initial platform reach.",
    "Parallel work increased leverage while making isolation, review, and permission controls essential.",
    "The real launch is evidence to compare against, not an answer key; another choice can still be defensible.",
  ],
};
