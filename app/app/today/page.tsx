import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { fixedPublicCase } from "../../lib/fixed-case";
import { TodayRepClient } from "./TodayRepClient";

export const metadata: Metadata = { title: "Today’s Rep" };

export default function TodayPage() {
  return (
    <AppShell active="today">
      <TodayRepClient initialCaseData={fixedPublicCase} />
    </AppShell>
  );
}
