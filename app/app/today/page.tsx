import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { fixedPublicCase } from "../../lib/fixed-case";
import { TodayRepClient } from "./TodayRepClient";

export const metadata: Metadata = { title: "Today’s Rep" };

export default function TodayPage() {
  return (
    <AppShell active="today">
      <header className="page-intro">
        <p className="eyebrow">TODAY’S REP · {fixedPublicCase.estimatedMinutes} MIN</p>
        <h1>Design the surface before seeing what shipped.</h1>
        <p>{fixedPublicCase.scenario}</p>
      </header>
      <TodayRepClient caseData={fixedPublicCase} />
    </AppShell>
  );
}
