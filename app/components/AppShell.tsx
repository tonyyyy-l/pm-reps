/* eslint-disable @next/next/no-html-link-for-pages -- Plain document navigation avoids the vinext client-hook failure previously observed in this project. */
import type { ReactNode } from "react";

type AppSection = "today" | "feedback" | "candidates" | "skills" | "proof";

const navGroups: Array<{
  label: string;
  items: Array<{ section: AppSection; label: string; description: string; href: string }>;
}> = [
  {
    label: "PRACTICE",
    items: [
      { section: "today", label: "Today’s Rep", description: "Make today’s decisions", href: "/app/today" },
      { section: "feedback", label: "Feedback", description: "Review and revise", href: "/app/feedback" },
      { section: "candidates", label: "Case Inbox", description: "Choose your next practice", href: "/app/candidates" },
    ],
  },
  {
    label: "PROGRESS & PROOF",
    items: [
      { section: "skills", label: "Skill Map", description: "See recurring patterns", href: "/app/skills" },
      { section: "proof", label: "Public Proof", description: "Publish selected work", href: "/app/proof" },
    ],
  },
];

export function AppShell({
  active,
  children,
}: {
  active: AppSection;
  children: ReactNode;
}) {
  return (
    <main className="product-shell">
      <header className="product-topbar">
        <a className="brand-mark brand-mark-light" href="/">
          PM REPS
        </a>
        <div className="topbar-meta">
          <span className="topbar-description">Daily product judgment practice</span>
          <span className="preview-chip">Private workspace</span>
        </div>
      </header>

      <div className="product-layout">
        <nav className="product-nav" aria-label="PM Reps workspace">
          {navGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <p className="nav-heading">{group.label}</p>
              {group.items.map((item) => (
                <a
                  key={item.section}
                  className="nav-item"
                  data-active={active === item.section ? "true" : "false"}
                  href={item.href}
                >
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </a>
              ))}
            </section>
          ))}
          <div className="nav-footer">
            <span>PM REPS MVP</span>
            <p>Private practice. Public proof only when you choose.</p>
          </div>
        </nav>

        <section className="product-content">{children}</section>
      </div>
    </main>
  );
}
