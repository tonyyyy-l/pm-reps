import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { CandidatesClient } from "./CandidatesClient";

export const metadata: Metadata = { title: "Case Inbox" };

export default function CandidatesPage() {
  return (
    <AppShell active="candidates">
      <header className="page-intro">
        <p className="eyebrow">CASE INBOX · LIVE AI HOT</p>
        <h1>Fresh product launches, held behind a review gate.</h1>
        <p>
          The inbox reads the current selected AI product feed server-side. A
          candidate cannot become a practice case until its source, evidence,
          hidden outcome, and leakage check are reviewed.
        </p>
      </header>
      <CandidatesClient />
    </AppShell>
  );
}
