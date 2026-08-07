import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { SkillsClient } from "./SkillsClient";

export const metadata: Metadata = { title: "Skill Map" };

export default function SkillsPage() {
  return (
    <AppShell active="skills">
      <header className="page-intro">
        <p className="eyebrow">YOUR JUDGMENT PATTERNS</p>
        <h1>See first-pass judgment and revision response separately.</h1>
        <p>
          First-pass signals guide practice after calibration. Revision shows how
          you respond to feedback without rewriting the original result.
        </p>
      </header>
      <SkillsClient />
    </AppShell>
  );
}
