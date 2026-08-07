"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Plain document navigation avoids the vinext client-hook failure previously observed in this project. */

import { useEffect, useState } from "react";
import type { DecisionCardSnapshot } from "../../lib/proof";

export function PublicProofClient({ slug }: { slug: string }) {
  const [snapshot, setSnapshot] = useState<DecisionCardSnapshot | null | undefined>();

  useEffect(() => {
    fetch(`/api/public-proof/${slug}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setSnapshot)
      .catch(() => setSnapshot(null));
  }, [slug]);

  if (snapshot === undefined) return <main className="public-proof-page">Loading Decision Card…</main>;
  if (!snapshot) {
    return (
      <main className="public-proof-page public-proof-missing">
        <a className="brand-mark" href="/">PM REPS</a>
        <h1>This Decision Card is private or unavailable.</h1>
      </main>
    );
  }

  return (
    <main className="public-proof-page">
      <nav className="public-proof-nav">
        <a className="brand-mark" href="/">PM REPS</a>
        <span>Evidence-backed AI product judgment</span>
      </nav>
      <article className="public-decision-card">
        <header>
          <p className="eyebrow">DECISION CARD · {snapshot.displayName}</p>
          <h1>{snapshot.case.title}</h1>
          <p className="public-card-meta">Published {new Date(snapshot.publishedAt).toLocaleDateString("en", { dateStyle: "long" })}</p>
        </header>
        <section>
          <h2>Decision</h2>
          <p>{snapshot.decision.summary}</p>
        </section>
        <section>
          <h2>Reasoning</h2>
          {snapshot.decision.reasoning.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
        <section>
          <h2>What changed</h2>
          <p>{snapshot.revisionSummary}</p>
        </section>
        {snapshot.comparison ? (
          <section>
            <h2>What the company chose or shipped</h2>
            <p>{snapshot.comparison.whatCompanyChoseOrShipped}</p>
            <small>{snapshot.comparison.note}</small>
          </section>
        ) : null}
        <footer>
          <span>Verified source</span>
          <a href={snapshot.source.canonicalUrl} rel="noreferrer" target="_blank">
            {snapshot.source.title}
          </a>
        </footer>
      </article>
    </main>
  );
}
