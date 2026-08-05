"use client";

import { useEffect, useState } from "react";

type Candidate = {
  id: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  permalink: string;
};

export function CandidatesClient() {
  const [data, setData] = useState<{
    candidates: Candidate[];
    fetchedAt: string;
    reviewStatus: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/candidates")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Case candidates unavailable.");
        setData(payload);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) return <article className="content-panel form-error">{error}</article>;
  if (!data) return <article className="content-panel">Checking the verified product feed…</article>;

  return (
    <>
      <div className="inbox-status">
        <div>
          <span>{data.candidates.length}</span>
          <p>current AI product candidates</p>
        </div>
        <p>{data.reviewStatus}</p>
      </div>
      <div className="candidate-list">
        {data.candidates.map((candidate, index) => (
          <article className="content-panel candidate-card" key={candidate.id}>
            <div className="candidate-index">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <p className="eyebrow">
                AI PRODUCT · {candidate.publishedAt ? new Date(candidate.publishedAt).toLocaleDateString("en", { dateStyle: "medium" }) : "DATE UNAVAILABLE"}
              </p>
              <h2>{candidate.title}</h2>
              <p>{candidate.summary ?? "Summary unavailable. Review the source before drafting a case."}</p>
              <a className="source-link" href={candidate.permalink} rel="noreferrer" target="_blank">
                Review on AI HOT
              </a>
            </div>
            <span className="review-chip">Needs review</span>
          </article>
        ))}
      </div>
      <p className="aihot-attribution">
        Source: <a href="https://aihot.virxact.com/" rel="noreferrer" target="_blank">AI HOT</a> · summaries are untrusted candidate inputs and never become an active rep automatically.
      </p>
    </>
  );
}
