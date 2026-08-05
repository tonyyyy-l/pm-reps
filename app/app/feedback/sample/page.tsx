import type { Metadata } from "next";
import { AppShell } from "../../../components/AppShell";

export const metadata: Metadata = { title: "Feedback" };

const rubric = [
  { label: "User linkage", width: "88%", outcome: "Strong" },
  { label: "Evidence use", width: "72%", outcome: "Supported" },
  { label: "AI awareness", width: "43%", outcome: "Partial" },
];

export default function FeedbackPage() {
  return (
    <AppShell active="feedback">
      <header className="page-intro">
        <p className="eyebrow">EVIDENCE FEEDBACK</p>
        <h1>Your reasoning, not a model answer.</h1>
        <p>
          A different choice can still be strong when the reasoning is grounded
          in the case evidence.
        </p>
      </header>

      <article className="content-panel feedback-panel">
        <div className="feedback-context">
          <span className="case-pill">Sample committed response</span>
          <p>
            Build a desktop command center because parallel agent work needs one
            place for supervision, isolation, and review.
          </p>
        </div>

        <div className="rubric-list">
          {rubric.map((row) => (
            <div className="rubric-row" key={row.label}>
              <span>{row.label}</span>
              <div className="rubric-track" aria-hidden="true">
                <span style={{ width: row.width }} />
              </div>
              <strong>{row.outcome}</strong>
            </div>
          ))}
        </div>

        <div className="feedback-callout">
          <p className="eyebrow">WHAT WOULD MAKE THIS STRONGER</p>
          <h2>Add a rollout stop condition.</h2>
          <p>
            Define the failure signal that would pause broader access when
            isolated tasks produce unsafe or conflicting changes.
          </p>
        </div>

        <div className="revision-preview">
          <span>Revision prompt</span>
          <p>
            What observable signal would make you pause or roll back the release?
          </p>
        </div>
      </article>
    </AppShell>
  );
}
