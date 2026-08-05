"use client";

import { useEffect, useMemo, useState } from "react";
import type { Evaluation } from "../../../lib/evaluation";
import type {
  CaseResponse,
  PublicCase,
} from "../../../lib/fixed-case";

type AttemptView = {
  id: string;
  status: string;
  committedAt: string;
  completedAt: string | null;
  originalResponses: CaseResponse[];
  revisionResponses: CaseResponse[] | null;
  evaluation: Evaluation | null;
  evaluatorMode: string | null;
};

type AttemptPayload = {
  attempt: AttemptView;
  caseData: PublicCase;
};

const ratingOrder = {
  strong: 4,
  supported: 3,
  partial: 2,
  missing: 1,
};

export function FeedbackClient({ attemptId }: { attemptId: string }) {
  const [payload, setPayload] = useState<AttemptPayload | null>(null);
  const [revisions, setRevisions] = useState<CaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then(async (response) => {
        const data = (await response.json()) as AttemptPayload | { error: string };
        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "Attempt unavailable.");
        }
        setPayload(data);
        setRevisions(
          (data.attempt.revisionResponses ?? data.attempt.originalResponses).map(
            (response) => ({ ...response }),
          ),
        );
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const allComplete = useMemo(
    () =>
      payload?.caseData.prompts.every((prompt) => {
        const response = revisions.find((item) => item.promptId === prompt.promptId);
        return Boolean(
          response?.rationale.trim() &&
            prompt.choices.some(
              (choice) => choice.choiceId === response.selectedChoiceId,
            ),
        );
      }) ?? false,
    [payload, revisions],
  );

  async function runEvaluation() {
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/attempts/${attemptId}/evaluate`, {
        method: "POST",
      });
      const data = (await response.json()) as
        | { evaluation: Evaluation; mode: string }
        | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Evaluation unavailable.");
      }
      setPayload((current) =>
        current
          ? {
              ...current,
              attempt: {
                ...current.attempt,
                status: "feedback_ready",
                evaluation: data.evaluation,
                evaluatorMode: data.mode,
              },
            }
          : current,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Evaluation unavailable.");
    } finally {
      setWorking(false);
    }
  }

  function updateRevision(promptId: string, patch: Partial<CaseResponse>) {
    setRevisions((current) =>
      current.map((response) =>
        response.promptId === promptId ? { ...response, ...patch } : response,
      ),
    );
  }

  async function submitRevision() {
    if (!allComplete) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/attempts/${attemptId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionResponses: revisions }),
      });
      const data = (await response.json()) as
        | { attempt: { status: string; completedAt: string } }
        | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Revision could not be saved.");
      }
      setPayload((current) =>
        current
          ? {
              ...current,
              attempt: {
                ...current.attempt,
                status: data.attempt.status,
                completedAt: data.attempt.completedAt,
                revisionResponses: revisions,
              },
            }
          : current,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Revision could not be saved.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <article className="content-panel">Loading your reasoning trail…</article>;
  if (!payload) return <article className="content-panel form-error">{error}</article>;

  const { attempt, caseData } = payload;
  const evaluation = attempt.evaluation;

  return (
    <div className="feedback-workspace">
      {!evaluation ? (
        <article className="content-panel evaluation-gate">
          <span className="case-pill">Original response locked</span>
          <h2>Ready for evidence-linked feedback.</h2>
          <p>
            The evaluator checks five dimensions. It can support a different
            product choice and never scores agreement with the real launch.
          </p>
          <button
            className="primary-button"
            disabled={working}
            onClick={runEvaluation}
            type="button"
          >
            {working ? "Evaluating…" : "Generate feedback"}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </article>
      ) : (
        <>
          <article className="content-panel evaluation-summary">
            <div className="summary-heading">
              <div>
                <p className="eyebrow">EVALUATION · {attempt.evaluatorMode === "model" ? "MODEL" : "EVIDENCE RULES"}</p>
                <h2>{evaluation.overallSummary}</h2>
              </div>
              <span className="evidence-badge">5 dimensions</span>
            </div>
            {attempt.evaluatorMode !== "model" ? (
              <p className="evaluation-disclosure">
                No model credential is configured, so this run uses the auditable
                rules baseline. It is labeled separately and never presented as AI output.
              </p>
            ) : null}
          </article>

          <div className="dimension-grid">
            {evaluation.dimensions.map((dimension) => (
              <article className="content-panel dimension-card" key={dimension.dimension}>
                <div className="dimension-title">
                  <span>{dimension.dimension.replaceAll("_", " ")}</span>
                  <strong data-rating={dimension.rating}>{dimension.rating}</strong>
                </div>
                <div className="rating-meter" aria-label={`${dimension.rating} rating`}>
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      className={level <= ratingOrder[dimension.rating] ? "filled" : ""}
                      key={level}
                    />
                  ))}
                </div>
                <p>{dimension.rationale}</p>
                <div className="citation-row">
                  {dimension.evidenceIds.length
                    ? dimension.evidenceIds.map((id) => <code key={id}>{id}</code>)
                    : "No factual citation used"}
                </div>
                <aside>
                  <strong>Try next</strong>
                  <p>{dimension.improvementPrompt}</p>
                </aside>
              </article>
            ))}
          </div>

          <article className="content-panel revision-panel">
            <p className="eyebrow">REVISION</p>
            <h2>Keep what holds up. Change what does not.</h2>
            <p>
              Your original answer stays locked beside this revision. Keeping an
              answer is valid—strengthen the rationale to explain why.
            </p>
            <div className="revision-list">
              {caseData.prompts.map((prompt, index) => {
                const original = attempt.originalResponses[index];
                const revision = revisions[index];
                const originalChoice = prompt.choices.find(
                  (choice) => choice.choiceId === original.selectedChoiceId,
                );
                return (
                  <section className="revision-row" key={prompt.promptId}>
                    <div className="original-column">
                      <span>ORIGINAL · LOCKED</span>
                      <strong>{originalChoice?.label}</strong>
                      <p>{original.rationale}</p>
                    </div>
                    <div className="revision-column">
                      <label>
                        <span>Revised decision</span>
                        <select
                          disabled={attempt.status === "completed"}
                          onChange={(event) =>
                            updateRevision(prompt.promptId, {
                              selectedChoiceId: event.target.value,
                            })
                          }
                          value={revision.selectedChoiceId}
                        >
                          {prompt.choices.map((choice) => (
                            <option key={choice.choiceId} value={choice.choiceId}>
                              {choice.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Revised rationale</span>
                        <textarea
                          disabled={attempt.status === "completed"}
                          onChange={(event) =>
                            updateRevision(prompt.promptId, {
                              rationale: event.target.value,
                            })
                          }
                          rows={4}
                          value={revision.rationale}
                        />
                      </label>
                    </div>
                  </section>
                );
              })}
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            {attempt.status === "completed" ? (
              <div className="completion-actions">
                <span className="locked-chip">Rep completed</span>
                <a className="secondary-button" href="/app/skills">View Skill Map</a>
                <a className="primary-link" href="/app/proof">Build Decision Card</a>
              </div>
            ) : (
              <button
                className="primary-button revision-submit"
                disabled={!allComplete || working}
                onClick={submitRevision}
                type="button"
              >
                {working ? "Saving…" : "Complete rep with revision"}
              </button>
            )}
          </article>
        </>
      )}
    </div>
  );
}
