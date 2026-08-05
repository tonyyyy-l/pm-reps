"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CaseResponse,
  PublicCase,
} from "../../lib/fixed-case";
import type { FixedCaseReveal } from "../../lib/fixed-case-reveal.server";

type ResponseDraft = {
  selectedChoiceId: string;
  rationale: string;
};

type DraftState = {
  caseId: string;
  step: number;
  responses: Record<string, ResponseDraft>;
};

const DRAFT_KEY = "pm-reps:fixed-agent-workspace-001:draft";

function emptyResponse(): ResponseDraft {
  return { selectedChoiceId: "", rationale: "" };
}

function isResponseComplete(response: ResponseDraft | undefined) {
  return Boolean(response?.selectedChoiceId && response.rationale.trim());
}

function readDraft(caseData: PublicCase): DraftState | null {
  try {
    const rawDraft = window.sessionStorage.getItem(DRAFT_KEY);
    if (!rawDraft) return null;
    const draft = JSON.parse(rawDraft) as Partial<DraftState>;
    if (
      draft.caseId !== caseData.caseId ||
      typeof draft.step !== "number" ||
      !draft.responses ||
      typeof draft.responses !== "object"
    ) {
      return null;
    }

    const safeResponses: Record<string, ResponseDraft> = {};
    for (const prompt of caseData.prompts) {
      const response = draft.responses[prompt.promptId];
      if (
        response &&
        typeof response.selectedChoiceId === "string" &&
        typeof response.rationale === "string" &&
        (response.selectedChoiceId === "" ||
          prompt.choices.some(
            (choice) => choice.choiceId === response.selectedChoiceId,
          ))
      ) {
        safeResponses[prompt.promptId] = response;
      }
    }

    return {
      caseId: caseData.caseId,
      step: Math.min(Math.max(0, draft.step), caseData.prompts.length),
      responses: safeResponses,
    };
  } catch {
    return null;
  }
}

export function TodayRepClient({ caseData }: { caseData: PublicCase }) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseDraft>>({});
  const [hydrated, setHydrated] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState("");
  const [originalResponses, setOriginalResponses] = useState<CaseResponse[]>([]);
  const [reveal, setReveal] = useState<FixedCaseReveal | null>(null);
  const [attemptId, setAttemptId] = useState("");

  const reviewStep = caseData.prompts.length;
  const activePrompt = step < reviewStep ? caseData.prompts[step] : null;
  const completeCount = caseData.prompts.filter((prompt) =>
    isResponseComplete(responses[prompt.promptId]),
  ).length;
  const allComplete = completeCount === caseData.prompts.length;

  const normalizedResponses = useMemo<CaseResponse[]>(
    () =>
      caseData.prompts.map((prompt) => ({
        promptId: prompt.promptId,
        selectedChoiceId: responses[prompt.promptId]?.selectedChoiceId ?? "",
        rationale: responses[prompt.promptId]?.rationale.trim() ?? "",
      })),
    [caseData.prompts, responses],
  );

  useEffect(() => {
    const draft = readDraft(caseData);
    if (draft) {
      setStep(draft.step);
      setResponses(draft.responses);
    }
    setHydrated(true);
  }, [caseData]);

  useEffect(() => {
    if (!hydrated || reveal) return;
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ caseId: caseData.caseId, step, responses }),
    );
  }, [caseData.caseId, hydrated, reveal, responses, step]);

  function updateResponse(patch: Partial<ResponseDraft>) {
    if (!activePrompt || committing || reveal) return;
    setResponses((current) => ({
      ...current,
      [activePrompt.promptId]: {
        ...(current[activePrompt.promptId] ?? emptyResponse()),
        ...patch,
      },
    }));
  }

  async function commitDecisions() {
    if (!allComplete || committing) return;
    const lockedResponses = normalizedResponses.map((response) => ({ ...response }));
    setCommitting(true);
    setCommitError("");

    try {
      const response = await fetch("/api/attempts/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: caseData.caseId,
            originalResponses: lockedResponses,
          }),
        });
      const payload = (await response.json()) as
        | {
            attempt: { attemptId: string };
            reveal: FixedCaseReveal;
          }
        | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "The reveal failed.");
      }

      setOriginalResponses(lockedResponses);
      setAttemptId(payload.attempt.attemptId);
      setReveal(payload.reveal);
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      setCommitError(
        error instanceof Error
          ? error.message
          : "The reveal failed. Your draft is still available.",
      );
    } finally {
      setCommitting(false);
    }
  }

  if (reveal) {
    return (
      <div className="reveal-stack">
        <article className="content-panel reveal-hero">
          <p className="eyebrow">CASE REVEALED · ORIGINAL RESPONSES LOCKED</p>
          <div className="reveal-heading">
            <div>
              <h2>{reveal.productName}</h2>
              <p>{reveal.companyName}</p>
            </div>
            <span className="locked-chip">Locked</span>
          </div>
          <p className="reveal-outcome">{reveal.realOutcome}</p>
          <div className="not-answer-key">
            The real launch is a comparison point, not an answer key. A different
            decision can be strong when the evidence and trade-offs support it.
          </div>
          <a
            className="source-link"
            href={reveal.source.canonicalUrl}
            rel="noreferrer"
            target="_blank"
          >
            Read the verified source: {reveal.source.title}
          </a>
          <div className="reveal-actions">
            <a className="primary-link" href={`/app/feedback/${attemptId}`}>
              Evaluate my reasoning
            </a>
            <span>Your committed answers are now saved privately.</span>
          </div>
        </article>

        <div className="post-commit-grid">
          <article className="content-panel">
            <p className="eyebrow">YOUR ORIGINAL DECISIONS</p>
            <div className="locked-response-list">
              {caseData.prompts.map((prompt, index) => {
                const response = originalResponses[index];
                const choice = prompt.choices.find(
                  (item) => item.choiceId === response.selectedChoiceId,
                );
                return (
                  <section key={prompt.promptId}>
                    <span>0{index + 1}</span>
                    <h3>{choice?.label}</h3>
                    <p>{response.rationale}</p>
                  </section>
                );
              })}
            </div>
          </article>

          <aside className="content-panel">
            <p className="eyebrow">EVIDENCE CHECK</p>
            <div className="commentary-list">
              {reveal.evidenceCommentary.map((item) => (
                <p key={item.evidenceId}>
                  <strong>{item.evidenceId}</strong>
                  {item.text}
                </p>
              ))}
            </div>
            <p className="prototype-boundary">
              Feedback evaluates the reasoning trail across five dimensions. It
              does not treat the real launch as the answer key.
            </p>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="step-progress" aria-label={`${completeCount} of 4 complete`}>
        {caseData.prompts.map((prompt) => (
          <span
            className={isResponseComplete(responses[prompt.promptId]) ? "complete" : ""}
            key={prompt.promptId}
          />
        ))}
      </div>

      <div className="decision-layout">
        <article className="content-panel decision-panel">
          {activePrompt ? (
            <>
              <div className="question-meta">
                <span className="case-pill">Decision {step + 1} of 4</span>
                <span>{activePrompt.dimension.replaceAll("_", " ")}</span>
              </div>
              <h2>{activePrompt.question}</h2>
              <div className="interactive-choices" role="group" aria-label="Decision choices">
                {activePrompt.choices.map((choice) => {
                  const selected =
                    responses[activePrompt.promptId]?.selectedChoiceId ===
                    choice.choiceId;
                  return (
                    <button
                      aria-pressed={selected}
                      className="choice-button"
                      data-selected={selected ? "true" : "false"}
                      key={choice.choiceId}
                      onClick={() =>
                        updateResponse({ selectedChoiceId: choice.choiceId })
                      }
                      type="button"
                    >
                      <span className="choice-dot" aria-hidden="true" />
                      <strong>{choice.label}</strong>
                    </button>
                  );
                })}
              </div>

              <label className="rationale-preview">
                <span>Your rationale</span>
                <textarea
                  onChange={(event) =>
                    updateResponse({ rationale: event.target.value })
                  }
                  placeholder="Use the evidence above. Name the trade-off you are accepting."
                  rows={4}
                  value={responses[activePrompt.promptId]?.rationale ?? ""}
                />
              </label>
            </>
          ) : (
            <>
              <span className="case-pill">Commitment review</span>
              <h2>Check all four decisions before you reveal the case.</h2>
              <p>
                Submission locks this original reasoning trail. You will not be
                able to edit it after the source and real launch appear.
              </p>
              <div className="review-list">
                {caseData.prompts.map((prompt, index) => {
                  const response = responses[prompt.promptId];
                  const choice = prompt.choices.find(
                    (item) => item.choiceId === response?.selectedChoiceId,
                  );
                  return (
                    <button
                      className="review-row"
                      data-complete={isResponseComplete(response) ? "true" : "false"}
                      key={prompt.promptId}
                      onClick={() => setStep(index)}
                      type="button"
                    >
                      <span>0{index + 1}</span>
                      <span>
                        <strong>{choice?.label ?? "Decision missing"}</strong>
                        <small>
                          {response?.rationale.trim() || "Rationale missing"}
                        </small>
                      </span>
                      <em>{isResponseComplete(response) ? "Edit" : "Complete"}</em>
                    </button>
                  );
                })}
              </div>
              {commitError ? <p className="form-error">{commitError}</p> : null}
            </>
          )}

          <div className="decision-actions">
            <button
              className="secondary-button"
              disabled={step === 0 || committing}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              type="button"
            >
              Back
            </button>
            {activePrompt ? (
              <button
                className="primary-button"
                disabled={!isResponseComplete(responses[activePrompt.promptId])}
                onClick={() => setStep((current) => Math.min(reviewStep, current + 1))}
                type="button"
              >
                {step === reviewStep - 1 ? "Review decisions" : "Next decision"}
              </button>
            ) : (
              <button
                className="primary-button"
                disabled={!allComplete || committing}
                onClick={commitDecisions}
                type="button"
              >
                {committing ? "Locking…" : "Lock & reveal case"}
              </button>
            )}
          </div>
          <p className="draft-status" aria-live="polite">
            {hydrated ? "Draft saved for this browser session." : "Loading draft…"}
          </p>
        </article>

        <aside className="content-panel evidence-panel">
          <p className="eyebrow">KNOWN EVIDENCE</p>
          <div className="evidence-list">
            {caseData.evidence.map((item) => (
              <div key={item.evidenceId}>
                <span>{item.evidenceId}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <p className="eyebrow constraint-heading">CONSTRAINTS</p>
          <ul className="constraint-list">
            {caseData.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
          <div className="locked-note">
            Company, product, source, and real launch stay hidden until all four
            responses are committed.
          </div>
        </aside>
      </div>
    </>
  );
}
