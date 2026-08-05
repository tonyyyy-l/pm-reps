import type { ReactNode } from "react";

type AppSection = "today" | "feedback" | "candidates" | "skills" | "proof";

const navItems: Array<{ section: AppSection; label: string; href: string }> = [
  { section: "today", label: "Today’s Rep", href: "/app/today" },
  { section: "feedback", label: "Feedback", href: "/app/feedback" },
  { section: "candidates", label: "Case Inbox", href: "/app/candidates" },
  { section: "skills", label: "Skill Map", href: "/app/skills" },
  { section: "proof", label: "Public Proof", href: "/app/proof" },
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
          <p className="nav-heading">WORKSPACE</p>
          {navItems.map((item) => (
            <a
              key={item.section}
              className="nav-item"
              data-active={active === item.section ? "true" : "false"}
              href={item.href}
            >
              {item.label}
            </a>
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
