import type { Metadata } from "next";
import { AppShell } from "../../../components/AppShell";
import { FeedbackClient } from "./FeedbackClient";

export const metadata: Metadata = { title: "Feedback" };

export default async function AttemptFeedbackPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return (
    <AppShell active="feedback">
      <header className="page-intro">
        <p className="eyebrow">EVIDENCE FEEDBACK</p>
        <h1>Your reasoning, not a model answer.</h1>
        <p>
          Inspect five dimensions, follow every factual citation, and keep the
          original visible while you revise.
        </p>
      </header>
      <FeedbackClient attemptId={attemptId} />
    </AppShell>
  );
}
