"use client";

import { useEffect, useState } from "react";
import type { Dimension, Rating } from "../../lib/evaluation";

type Pattern = {
  dimension: Dimension;
  completedReps: number;
  pattern: string;
  latestRating: Rating | null;
  latestRationale: string | null;
};

const labels: Record<Dimension, string> = {
  user_problem: "User & problem",
  evidence_use: "Evidence use",
  metric_validity: "Metrics & evals",
  ai_system_awareness: "AI system awareness",
  rollout_judgment: "Rollout judgment",
};

export function SkillsClient() {
  const [data, setData] = useState<{ patterns: Pattern[]; completedReps: number } | null>(null);
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
      <div className="skill-map-header">
        <span>{data.completedReps}</span>
        <p>completed {data.completedReps === 1 ? "rep" : "reps"} contributing evidence</p>
      </div>
      <div className="pattern-grid skill-pattern-grid">
        {data.patterns.map((pattern, index) => (
          <article className="content-panel pattern-card" key={pattern.dimension}>
            <span className="pattern-index">0{index + 1}</span>
            <h2>{labels[pattern.dimension]}</h2>
            <strong>{pattern.pattern}</strong>
            <p>
              {pattern.latestRationale ??
                "Complete a revised rep before this dimension becomes evidence of a pattern."}
            </p>
            <small>
              {pattern.completedReps} observation{pattern.completedReps === 1 ? "" : "s"}
              {pattern.latestRating ? ` · latest ${pattern.latestRating}` : ""}
            </small>
          </article>
        ))}
      </div>
      <aside className="next-practice">
        <p className="eyebrow">SUGGESTED NEXT REP</p>
        <h2>
          {data.completedReps
            ? "Strengthen the lowest-evidence dimension in your next product decision."
            : "Complete Today’s Rep to create your first evidence-backed pattern."}
        </h2>
      </aside>
    </>
  );
}
