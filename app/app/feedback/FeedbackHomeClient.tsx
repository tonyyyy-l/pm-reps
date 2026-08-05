"use client";

import { useEffect, useState } from "react";

type LatestAttempt = {
  id: string;
  status: string;
  committedAt: string;
};

export function FeedbackHomeClient() {
  const [attempt, setAttempt] = useState<LatestAttempt | null | undefined>();

  useEffect(() => {
    fetch("/api/attempts/latest")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: { attempt: LatestAttempt | null }) => setAttempt(payload.attempt))
      .catch(() => setAttempt(null));
  }, []);

  return (
    <article className="content-panel feedback-home-card">
      {attempt === undefined ? (
        <p>Finding your latest committed rep…</p>
      ) : attempt ? (
        <>
          <span className="case-pill">Latest rep · {attempt.status.replaceAll("_", " ")}</span>
          <h2>Your reasoning trail is ready.</h2>
          <p>
            Open the committed attempt to generate or review feedback, revise your
            decision, and complete the rep.
          </p>
          <a className="primary-link" href={`/app/feedback/${attempt.id}`}>
            Open latest feedback
          </a>
        </>
      ) : (
        <>
          <span className="case-pill">No committed rep yet</span>
          <h2>Make the decision before asking for feedback.</h2>
          <p>Complete Today’s Rep first so the source cannot shape your original answer.</p>
          <a className="primary-link" href="/app/today">
            Start today’s rep
          </a>
        </>
      )}
    </article>
  );
}
