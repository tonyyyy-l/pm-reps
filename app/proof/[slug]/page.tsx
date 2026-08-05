import type { Metadata } from "next";
import { PublicProofClient } from "./PublicProofClient";

export const metadata: Metadata = { title: "Decision Card" };

export default async function PublicProofPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicProofClient slug={slug} />;
}
