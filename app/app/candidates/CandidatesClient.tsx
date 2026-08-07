"use client";

import { useEffect, useState } from "react";
import type { Dimension } from "../../lib/evaluation";

type CandidateStatus =
  | "queued"
  | "generating"
  | "active"
  | "completed"
  | "rejected"
  | "seen"
  | "preflight_failed";

type CompletedCandidate = {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  publishedAt: string | null;
  permalink: string;
  sourceUrl: string;
  status: "completed";
  fitDimensions: string[];
};

type PoolCounts = Record<CandidateStatus, number> & { total: number };

const dimensionLabels: Record<string, string> = {
  user_problem: "User & problem",
  evidence_use: "Evidence use",
  metric_validity: "Metrics & evals",
  ai_system_awareness: "AI system awareness",
  rollout_judgment: "Rollout judgment",
};

export function CandidatesClient() {
  const [data, setData] = useState<{
    completed: CompletedCandidate[];
    pool: {
      counts: PoolCounts;
      coverage: Array<{ dimension: Dimension; count: number }>;
      synced: boolean;
      addedOrUpdated: number;
      excluded: number;
      warning: string | null;
    };
    practicePlan: {
      targetDimension: Dimension;
      difficulty: string;
      reason: string;
      calibration: { completed: number; required: number; complete: boolean };
    };
    automation: { ready: boolean; status: string };
  } | null>(null);
  const [error, setError] = useState("");
  const [workingMode, setWorkingMode] = useState<"targeted" | "surprise" | null>(null);

  useEffect(() => {
    fetch("/api/candidates")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Practice pool unavailable.");
        setData(payload);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  async function startRep(mode: "targeted" | "surprise") {
    setWorkingMode(mode);
    setError("");
    try {
      const response = await fetch("/api/cases/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = (await response.json()) as
        | { status: string; caseData: { caseId: string } }
        | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Rep generation failed.");
      }
      window.location.href = "/app/today";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Rep generation failed.");
      setWorkingMode(null);
    }
  }

  if (error && !data) return <article className="content-panel form-error">{error}</article>;
  if (!data) return <article className="content-panel">Syncing your private practice pool…</article>;

  const { counts } = data.pool;
  const plan = data.practicePlan;
  return (
    <>
      <section className="content-panel pool-control-panel deliberate-practice-panel">
        <div>
          <p className="eyebrow">NEXT DELIBERATE REP</p>
          <h2>{dimensionLabels[plan.targetDimension]}</h2>
          <p>{plan.reason}</p>
          <div className="case-plan-chips">
            <span>{plan.calibration.complete ? "Calibration complete" : `Calibration ${plan.calibration.completed}/${plan.calibration.required}`}</span>
            <span>Difficulty · {plan.difficulty.replaceAll("_", " ")}</span>
          </div>
        </div>
        <div className="pool-action-stack">
          <button
            className="primary-button random-rep-button"
            disabled={!data.automation.ready || counts.queued === 0 || workingMode !== null}
            onClick={() => startRep("targeted")}
            type="button"
          >
            {workingMode === "targeted" ? "Building targeted rep…" : "Start targeted rep"}
          </button>
          <button
            className="secondary-button"
            disabled={!data.automation.ready || counts.queued === 0 || workingMode !== null}
            onClick={() => startRep("surprise")}
            type="button"
          >
            {workingMode === "surprise" ? "Finding a surprise…" : "Surprise me"}
          </button>
        </div>
      </section>

      <div className="pool-stats" aria-label="Practice pool status">
        <div><span>{counts.queued}</span><p>Unseen & eligible</p></div>
        <div><span>{counts.active}</span><p>Active</p></div>
        <div><span>{counts.completed}</span><p>Completed</p></div>
        <div><span>{counts.seen}</span><p>Recognized & skipped</p></div>
      </div>

      <section className="content-panel anonymous-pool-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ANONYMOUS CASE COVERAGE</p>
            <h2>Know what you can practice, not which launch is next.</h2>
            <p>Titles, companies, and sources stay hidden until a rep is completed.</p>
          </div>
        </div>
        <div className="coverage-grid">
          {data.pool.coverage.map((item, index) => (
            <div key={item.dimension}>
              <span>0{index + 1}</span>
              <strong>{dimensionLabels[item.dimension]}</strong>
              <p>{item.count} unseen cases</p>
            </div>
          ))}
        </div>
      </section>

      <p className="pool-system-status">{data.automation.status}</p>
      {data.pool.synced ? (
        <p className="pool-sync-note">
          The latest selected-only sync refreshed {data.pool.addedOrUpdated} practice-fit records and excluded {data.pool.excluded} unsuitable or unreadable items.
        </p>
      ) : null}
      {data.pool.warning ? <article className="content-panel form-error">{data.pool.warning}</article> : null}
      {error ? <article className="content-panel form-error">{error}</article> : null}

      {data.completed.length ? (
        <section className="completed-case-history">
          <div className="section-heading">
            <div><p className="eyebrow">COMPLETED CASES</p><h2>Identity is visible after practice.</h2></div>
          </div>
          <div className="candidate-list">
            {data.completed.map((candidate, index) => (
              <article className="content-panel candidate-card" key={candidate.id}>
                <div className="candidate-index">{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <p className="eyebrow">{candidate.source} · {candidate.publishedAt ? new Date(candidate.publishedAt).toLocaleDateString("en", { dateStyle: "medium" }) : "DATE UNAVAILABLE"}</p>
                  <h2>{candidate.title}</h2>
                  <div className="fit-dimensions">
                    {candidate.fitDimensions.map((dimension) => <span key={dimension}>{dimensionLabels[dimension] ?? dimension}</span>)}
                  </div>
                  <div className="candidate-actions">
                    <a href={candidate.permalink} rel="noreferrer" target="_blank">View on AI HOT</a>
                    <a href={candidate.sourceUrl} rel="noreferrer" target="_blank">Original source</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <p className="aihot-attribution">
        Discovery uses <a href="https://aihot.virxact.com/" rel="noreferrer" target="_blank">AI HOT</a> selected AI products only. Source preflight and practice-fit filtering happen before a launch enters this private pool.
      </p>
    </>
  );
}
