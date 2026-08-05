import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const description =
    "Practice AI product judgment on real launches, inspect evidence-linked feedback, and turn revisions into portfolio proof.";

  return {
    metadataBase: base,
    title: {
      default: "PM Reps",
      template: "%s · PM Reps",
    },
    description,
    openGraph: {
      title: "PM Reps — Decide before you see what shipped",
      description,
      type: "website",
      images: [
        {
          url: new URL("/og.png", base).toString(),
          width: 1731,
          height: 909,
          alt: "PM Reps decision practice card",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "PM Reps — Decide before you see what shipped",
      description,
      images: [new URL("/og.png", base).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
