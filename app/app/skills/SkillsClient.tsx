"use client";

import { useEffect, useState } from "react";
import type { Dimension, Rating } from "../../lib/evaluation";

type Signal = {
  observationCount: number;
  eligibleCount: number;
  excludedCount: number;
  pattern: string;
  latestRating: Rating | null;
  latestRationale: string | null;
  latestConfidence: string | null;
  latestDifficulty: string | null;
};

type Pattern = {
  dimension: Dimension;
  firstPass: Signal;
  revisionResponse: Signal;
};

const labels: Record<Dimension, string> = {
  user_problem: "User & problem",
  evidence_use: "Evidence use",
  metric_validity: "Metrics & evals",
  ai_system_awareness: "AI system awareness",
  rollout_judgment: "Rollout judgment",
};

export function SkillsClient() {
  const [data, setData] = useState<{
    patterns: Pattern[];
    completedReps: number;
    calibration: { completed: number; required: number; complete: boolean; label: string };
    disputedObservations: number;
    suggestedNext: { targetDimension: Dimension; difficulty: string; reason: string };
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/skills")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Skill Map unavailable.");
        setData(payload);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) return <article className="content-panel form-error">{error}</article>;
  if (!data) return <article className="content-panel">Loading completed reps…</article>;

  return (
    <>
      <div className="skill-map-header calibration-header">
        <span>{data.calibration.completed}/{data.calibration.required}</span>
        <div>
          <strong>{data.calibration.label}</strong>
          <p>{data.calibration.complete ? "First-pass patterns now guide targeted practice." : "Signals stay provisional until five balanced reps are complete."}</p>
        </div>
      </div>
      <div className="pattern-grid skill-pattern-grid">
        {data.patterns.map((pattern, index) => (
          <article className="content-panel pattern-card" key={pattern.dimension}>
            <span className="pattern-index">0{index + 1}</span>
            <h2>{labels[pattern.dimension]}</h2>
            <div className="signal-comparison">
              <section>
                <small>FIRST PASS · ROUTING SIGNAL</small>
                <strong>{pattern.firstPass.pattern}</strong>
                <p>{pattern.firstPass.latestRationale ?? "No trusted first-pass evidence yet."}</p>
                <em>{signalMeta(pattern.firstPass)}</em>
              </section>
              <section>
                <small>REVISION RESPONSE</small>
                <strong>{pattern.revisionResponse.pattern}</strong>
                <p>{pattern.revisionResponse.latestRationale ?? "No revision-response evidence yet."}</p>
                <em>{signalMeta(pattern.revisionResponse)}</em>
              </section>
            </div>
          </article>
        ))}
      </div>
      <aside className="next-practice">
        <p className="eyebrow">SUGGESTED NEXT REP</p>
        <h2>{labels[data.suggestedNext.targetDimension]} · {data.suggestedNext.difficulty.replaceAll("_", " ")}</h2>
        <p>{data.suggestedNext.reason}</p>
        {data.disputedObservations ? <small>{data.disputedObservations} disputed observation{data.disputedObservations === 1 ? " is" : "s are"} excluded from routing.</small> : null}
      </aside>
    </>
  );
}

function signalMeta(signal: Signal) {
  const latest = signal.latestRating
    ? `latest ${signal.latestRating} · ${signal.latestConfidence} confidence · ${signal.latestDifficulty}`
    : "no rating yet";
  return `${signal.eligibleCount}/${signal.observationCount} trusted · ${latest}`;
}
