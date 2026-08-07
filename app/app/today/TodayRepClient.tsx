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
  initialDirection: string;
};

type DraftState = {
  caseId: string;
  step: number;
  responses: Record<string, ResponseDraft>;
  optionsRevealed: Record<string, boolean>;
};

function draftKey(caseId: string) {
  return `pm-reps:${caseId}:draft`;
}

function shortEvidenceId(evidenceId: string) {
  return evidenceId.replace("evidence-", "E-").toUpperCase();
}

function emptyResponse(): ResponseDraft {
  return { selectedChoiceId: "", rationale: "", initialDirection: "" };
}

function isResponseComplete(
  response: ResponseDraft | undefined,
  prompt?: PublicCase["prompts"][number],
) {
  return Boolean(
    response?.selectedChoiceId &&
      response.rationale.trim() &&
      (!prompt?.initialDirectionRequired || response.initialDirection.trim()),
  );
}

function readDraft(caseData: PublicCase): DraftState | null {
  try {
    const rawDraft = window.sessionStorage.getItem(draftKey(caseData.caseId));
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
        (response.initialDirection === undefined ||
          typeof response.initialDirection === "string") &&
        (response.selectedChoiceId === "" ||
          prompt.choices.some(
            (choice) => choice.choiceId === response.selectedChoiceId,
          ))
      ) {
        safeResponses[prompt.promptId] = {
          ...response,
          initialDirection: response.initialDirection ?? "",
        };
      }
    }

    return {
      caseId: caseData.caseId,
      step: Math.min(Math.max(0, draft.step), caseData.prompts.length),
      responses: safeResponses,
      optionsRevealed:
        draft.optionsRevealed && typeof draft.optionsRevealed === "object"
          ? draft.optionsRevealed
          : {},
    };
  } catch {
    return null;
  }
}

export function TodayRepClient({
  initialCaseData,
}: {
  initialCaseData: PublicCase;
}) {
  const [caseData, setCaseData] = useState(initialCaseData);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseDraft>>({});
  const [optionsRevealed, setOptionsRevealed] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState("");
  const [originalResponses, setOriginalResponses] = useState<CaseResponse[]>([]);
  const [reveal, setReveal] = useState<FixedCaseReveal | null>(null);
  const [attemptId, setAttemptId] = useState("");
  const [recognizing, setRecognizing] = useState(false);

  const reviewStep = caseData.prompts.length;
  const activePrompt = step < reviewStep ? caseData.prompts[step] : null;
  const completeCount = caseData.prompts.filter((prompt) =>
    isResponseComplete(responses[prompt.promptId], prompt),
  ).length;
  const allComplete = completeCount === caseData.prompts.length;

  const normalizedResponses = useMemo<CaseResponse[]>(
    () =>
      caseData.prompts.map((prompt) => ({
        promptId: prompt.promptId,
        selectedChoiceId: responses[prompt.promptId]?.selectedChoiceId ?? "",
        rationale: responses[prompt.promptId]?.rationale.trim() ?? "",
        initialDirection:
          responses[prompt.promptId]?.initialDirection.trim() || undefined,
      })),
    [caseData.prompts, responses],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cases/today")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { caseData?: PublicCase };
      })
      .then((payload) => {
        if (!cancelled && payload?.caseData?.caseId && payload.caseData.caseId !== caseData.caseId) {
          setCaseData(payload.caseData);
          setStep(0);
          setResponses({});
          setOptionsRevealed({});
          setOriginalResponses([]);
          setReveal(null);
          setAttemptId("");
        }
      })
      .catch(() => {
        // The manually verified fixed case remains available when live case loading fails.
      });
    return () => {
      cancelled = true;
    };
  }, [caseData.caseId]);

  useEffect(() => {
    const draft = readDraft(caseData);
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Session storage is an external draft source restored after hydration.
      setStep(draft.step);
      setResponses(draft.responses);
      setOptionsRevealed(draft.optionsRevealed);
    }
    setHydrated(true);
  }, [caseData]);

  useEffect(() => {
    if (!hydrated || reveal) return;
    window.sessionStorage.setItem(
      draftKey(caseData.caseId),
      JSON.stringify({ caseId: caseData.caseId, step, responses, optionsRevealed }),
    );
  }, [caseData.caseId, hydrated, optionsRevealed, reveal, responses, step]);

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

  function insertEvidence(evidenceId: string) {
    if (!activePrompt) return;
    const current = responses[activePrompt.promptId]?.rationale ?? "";
    const token = `[${shortEvidenceId(evidenceId)}]`;
    if (current.includes(token)) return;
    updateResponse({ rationale: `${current}${current.trim() ? " " : ""}${token} ` });
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
      window.sessionStorage.removeItem(draftKey(caseData.caseId));
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

  async function replaceRecognizedCase() {
    if (recognizing) return;
    setRecognizing(true);
    setCommitError("");
    try {
      const response = await fetch("/api/cases/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "targeted",
          replaceRecognizedCaseId: caseData.caseId,
        }),
      });
      const payload = (await response.json()) as { caseData?: PublicCase; error?: string };
      if (!response.ok || !payload.caseData) throw new Error(payload.error ?? "A replacement case is unavailable.");
      window.sessionStorage.removeItem(draftKey(caseData.caseId));
      setCaseData(payload.caseData);
      setStep(0);
      setResponses({});
      setOptionsRevealed({});
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : "A replacement case is unavailable.");
    } finally {
      setRecognizing(false);
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
          <div className="not-answer-key">
            The company choice is a comparison point, not an answer key. A different
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

          <aside className="content-panel company-comparison-panel">
            <p className="eyebrow">WHAT THE COMPANY CHOSE OR SHIPPED</p>
            <h2>{reveal.productName}</h2>
            <p className="reveal-outcome">{reveal.whatShipped}</p>
            <p className="prototype-boundary">
              Compare the trade-offs. Matching the company is not the scoring rule.
            </p>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="today-rep-intro">
        <div>
          <p className="eyebrow">TODAY’S REP</p>
          <h1>Decide what this AI product should ship.</h1>
          <p>
            Read the case brief, make {caseData.prompts.length} product decisions, then commit before
            you see the company and what it shipped.
          </p>
          <div className="case-plan-chips">
            <span>Target · {caseData.targetDimension.replaceAll("_", " ")}</span>
            <span>Difficulty · {caseData.difficulty.replaceAll("_", " ")}</span>
          </div>
        </div>
        <div className="today-header-actions">
          <span className="time-chip">About {caseData.estimatedMinutes} min</span>
          <button className="recognize-button" disabled={recognizing} onClick={replaceRecognizedCase} type="button">
            {recognizing ? "Replacing…" : "I recognize this launch"}
          </button>
        </div>
      </header>

      <div className="exercise-flow" aria-label="Exercise flow">
        <div data-active="true"><span>1</span><p><strong>Decide</strong>Answer {caseData.prompts.length} questions</p></div>
        <div><span>2</span><p><strong>Commit</strong>Lock your reasoning</p></div>
        <div><span>3</span><p><strong>Reveal</strong>Compare and revise</p></div>
      </div>

      <section className="content-panel case-brief-panel">
        <header className="section-heading">
          <div>
            <p className="eyebrow">READ FIRST</p>
            <h2>1. Read the case brief</h2>
            <p>This is the information you can use in all {caseData.prompts.length} decisions.</p>
          </div>
        </header>
        <div className="case-brief-grid">
          <article className="scenario-brief">
            <p className="eyebrow">SCENARIO</p>
            <h3>Product decision context</h3>
            <p>{caseData.scenario}</p>
          </article>
          <article className="brief-evidence">
            <p className="eyebrow">KNOWN EVIDENCE</p>
            <div className="evidence-grid">
              {caseData.evidence.map((item) => (
                <div key={item.evidenceId}>
                  <span>{shortEvidenceId(item.evidenceId)}</span>
                  <small>{item.category}</small>
                  <p>{item.text}</p>
                  <em>{item.provenance.replaceAll("_", " ")}</em>
                </div>
              ))}
            </div>
          </article>
          <article className="brief-constraints">
            <p className="eyebrow">CONSTRAINTS</p>
            <ul className="constraint-list">
              {caseData.constraints.map((constraint) => (
                <li key={constraint}>{constraint}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <div className="step-progress" aria-label={`${completeCount} of ${caseData.prompts.length} complete`}>
        {caseData.prompts.map((prompt) => (
          <span
            className={isResponseComplete(responses[prompt.promptId], prompt) ? "complete" : ""}
            key={prompt.promptId}
          />
        ))}
      </div>

      <div className="decision-layout decision-layout-single">
        <article className="content-panel decision-panel">
          <div className="section-heading task-heading">
            <div>
              <p className="eyebrow">YOUR TASK</p>
              <h2>
                {activePrompt
                  ? `2. Make decision ${step + 1} of ${caseData.prompts.length}`
                  : `2. Review all ${caseData.prompts.length} decisions`}
              </h2>
            </div>
            <span>{completeCount} of {caseData.prompts.length} complete</span>
          </div>
          {activePrompt ? (
            <>
              <div className="question-meta">
                <span>{activePrompt.dimension.replaceAll("_", " ")}</span>
              </div>
              <h2>{activePrompt.question}</h2>
              {activePrompt.initialDirectionRequired ? (
                <div className="initial-direction-block">
                  <label className="rationale-preview">
                    <span>Your initial direction — before seeing the options</span>
                    <textarea
                      disabled={optionsRevealed[activePrompt.promptId]}
                      onChange={(event) => updateResponse({ initialDirection: event.target.value })}
                      placeholder="Write the direction you would take and the user need you are prioritizing."
                      rows={3}
                      value={responses[activePrompt.promptId]?.initialDirection ?? ""}
                    />
                  </label>
                  {!optionsRevealed[activePrompt.promptId] ? (
                    <button
                      className="secondary-button reveal-options-button"
                      disabled={!responses[activePrompt.promptId]?.initialDirection.trim()}
                      onClick={() => setOptionsRevealed((current) => ({ ...current, [activePrompt.promptId]: true }))}
                      type="button"
                    >
                      Lock direction & reveal options
                    </button>
                  ) : (
                    <p className="locked-direction-note">Initial direction locked for this draft.</p>
                  )}
                </div>
              ) : null}
              {!activePrompt.initialDirectionRequired || optionsRevealed[activePrompt.promptId] ? (
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
              ) : null}

              <label className="rationale-preview">
                <span>Why this decision? Name the trade-off you accept and the second-best option you reject.</span>
                <textarea
                  onChange={(event) =>
                    updateResponse({ rationale: event.target.value })
                  }
                  placeholder="Use the evidence above. Explain why your choice beats the strongest alternative."
                  rows={4}
                  value={responses[activePrompt.promptId]?.rationale ?? ""}
                />
              </label>
              <div className="evidence-insert-row" aria-label="Insert evidence reference">
                <span>Insert evidence</span>
                {caseData.evidence.map((item) => (
                  <button key={item.evidenceId} onClick={() => insertEvidence(item.evidenceId)} type="button">
                    {shortEvidenceId(item.evidenceId)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <span className="case-pill">Commitment review</span>
              <h2>Check all {caseData.prompts.length} decisions before you reveal the case.</h2>
              <p>
                Submission locks this original reasoning trail. You will not be
                able to edit it after the source and company choice appear.
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
                      data-complete={isResponseComplete(response, prompt) ? "true" : "false"}
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
                      <em>{isResponseComplete(response, prompt) ? "Edit" : "Complete"}</em>
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
                disabled={!isResponseComplete(responses[activePrompt.promptId], activePrompt)}
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

      </div>
    </>
  );
}
