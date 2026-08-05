import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { FeedbackHomeClient } from "./FeedbackHomeClient";

export const metadata: Metadata = { title: "Feedback" };

export default function FeedbackHomePage() {
  return (
    <AppShell active="feedback">
      <header className="page-intro">
        <p className="eyebrow">EVIDENCE FEEDBACK</p>
        <h1>Inspect the reasoning, then make it better.</h1>
        <p>
          Feedback is tied to case evidence and keeps your original response
          separate from every revision.
        </p>
      </header>
      <FeedbackHomeClient />
    </AppShell>
  );
}
