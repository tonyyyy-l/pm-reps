"use client";

import { useEffect, useState } from "react";
import type { DecisionCardSnapshot } from "../../lib/proof";

type Card = {
  id: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  snapshot: DecisionCardSnapshot;
};

export function ProofClient() {
  const [card, setCard] = useState<Card | null | undefined>();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/proof")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Decision Card unavailable.");
        setCard(payload.card);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  async function changePublication(action: "publish" | "unpublish") {
    if (!card) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/proof/${card.id}/${action}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Publication update failed.");
      setCard(payload.card);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Publication update failed.");
    } finally {
      setWorking(false);
    }
  }

  if (error && card === undefined) {
    return <article className="content-panel form-error">{error}</article>;
  }
  if (card === undefined) return <article className="content-panel">Loading private proof…</article>;
  if (!card) {
    return (
      <article className="content-panel empty-proof">
        <span className="case-pill">No completed rep yet</span>
        <h2>Your first Decision Card starts with a revision.</h2>
        <p>Complete Today’s Rep, review feedback, and submit a revision first.</p>
        <a className="primary-link" href="/app/today">Start today’s rep</a>
      </article>
    );
  }

  const snapshot = card.snapshot;
  const isPublished = card.status === "published";
  return (
    <>
      <div className="proof-state-row">
        <span className={isPublished ? "published-chip" : "private-chip"}>
          {isPublished ? "Published" : "Private draft"}
        </span>
        {isPublished ? (
          <a className="source-link" href={`/proof/${card.slug}`} target="_blank">
            Open public card
          </a>
        ) : null}
      </div>
      <article className="proof-card">
        <header className="proof-header">
          <div>
            <p className="eyebrow">DECISION CARD</p>
            <h2>{snapshot.case.title}</h2>
          </div>
          <span className="evidence-badge">Evidence linked</span>
        </header>
        <section>
          <h3>My decision</h3>
          <p>{snapshot.decision.summary}</p>
        </section>
        <section>
          <h3>Reasoning trail</h3>
          {snapshot.decision.reasoning.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
        <section>
          <h3>What changed after feedback</h3>
          <p>{snapshot.revisionSummary}</p>
        </section>
        {snapshot.comparison ? (
          <section>
            <h3>What the company chose or shipped</h3>
            <p>{snapshot.comparison.whatCompanyChoseOrShipped}</p>
            <small>{snapshot.comparison.note}</small>
          </section>
        ) : null}
        <section className="proof-source">
          <h3>Verified source</h3>
          <p>{snapshot.source.title}</p>
        </section>
      </article>
      {error ? <p className="form-error proof-card">{error}</p> : null}
      <div className="proof-actions">
        {isPublished ? (
          <button
            className="secondary-button"
            disabled={working}
            onClick={() => changePublication("unpublish")}
            type="button"
          >
            {working ? "Updating…" : "Unpublish card"}
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={working}
            onClick={() => changePublication("publish")}
            type="button"
          >
            {working ? "Publishing…" : "Publish Decision Card"}
          </button>
        )}
      </div>
    </>
  );
}
