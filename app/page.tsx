/* eslint-disable @next/next/no-html-link-for-pages -- Plain document navigation avoids the vinext client-hook failure previously observed in this project. */
export default function Home() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Primary navigation">
        <a className="brand-mark" href="/">
          PM REPS
        </a>
        <a className="text-link" href="/app/today">
          Open workspace
        </a>
      </nav>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">DAILY AI PRODUCT JUDGMENT</p>
          <h1>Decide before you see what the company shipped.</h1>
          <p className="hero-summary">
            PM Reps turns verified AI product launches into short decision
            exercises. Commit your reasoning, inspect evidence-linked feedback,
            then revise what you would do.
          </p>
          <div className="landing-actions">
            <a className="primary-link" href="/app/today">
              Start today&apos;s rep
            </a>
            <span className="stage-note">Private by default · evidence linked</span>
          </div>
        </div>

        <aside className="landing-sample" aria-label="Sample decision card">
          <div className="sample-header">
            <span>REP 012</span>
            <span>8 MIN</span>
          </div>
          <p className="case-label">AI AGENT WORKSPACE · PRODUCT PRIORITY</p>
          <h2>Which surface makes parallel agent work safe and reviewable?</h2>
          <div className="sample-rule" />
          <p className="sample-decision">A desktop command center</p>
          <p className="sample-reason">
            The product should reduce supervision friction while isolating
            concurrent code changes and preserving explicit permissions.
          </p>
          <span className="evidence-badge">Evidence linked after commit</span>
        </aside>
      </section>

      <section className="landing-principles" aria-label="Product principles">
        <article>
          <span>01</span>
          <h2>Commit first</h2>
          <p>The source and company choice stay hidden until your decision is locked.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Reason, not imitate</h2>
          <p>A different choice can be strong when the evidence supports it.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Revise visibly</h2>
          <p>Your original decision and the change after feedback remain together.</p>
        </article>
      </section>
    </main>
  );
}
