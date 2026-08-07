import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { CandidatesClient } from "./CandidatesClient";

export const metadata: Metadata = { title: "Case Inbox" };

export default function CandidatesPage() {
  return (
    <AppShell active="candidates">
      <header className="page-intro">
        <p className="eyebrow">CASE INBOX · PRIVATE PRACTICE POOL</p>
        <h1>A filtered pool that trains product judgment.</h1>
        <p>
          PM Reps reads only AI HOT selected products, preflights their sources, and keeps
          unseen identities hidden. Targeted practice chooses a dimension first, then randomly
          draws a suitable launch; Surprise me samples the wider eligible pool.
        </p>
      </header>
      <CandidatesClient />
    </AppShell>
  );
}
