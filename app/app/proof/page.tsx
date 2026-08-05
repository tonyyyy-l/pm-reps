import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { ProofClient } from "./ProofClient";

export const metadata: Metadata = { title: "Public Proof" };

export default function ProofPage() {
  return (
    <AppShell active="proof">
      <header className="page-intro proof-intro">
        <div>
          <p className="eyebrow">PUBLIC PROOF</p>
          <h1>Make the reasoning trail recruiter-readable.</h1>
          <p>Preview privately, publish deliberately, and unpublish at any time.</p>
        </div>
      </header>
      <ProofClient />
    </AppShell>
  );
}
