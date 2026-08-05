import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { SkillsClient } from "./SkillsClient";

export const metadata: Metadata = { title: "Skill Map" };

export default function SkillsPage() {
  return (
    <AppShell active="skills">
      <header className="page-intro">
        <p className="eyebrow">YOUR JUDGMENT PATTERNS</p>
        <h1>Progress comes from completed revisions.</h1>
        <p>
          Patterns are derived only from completed reps with valid feedback.
          There is no universal PM score.
        </p>
      </header>
      <SkillsClient />
    </AppShell>
  );
}
