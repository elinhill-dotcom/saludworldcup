"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/picks", label: "My picks" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/results", label: "Results" },
  { href: "/live", label: "Live chat" },
];

export function Nav() {
  const pathname = usePathname();
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch("/api/matches/live")
        .then((r) => r.json())
        .then((d) => setLiveCount(d.count ?? 0));
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="nav-bar">
      <div className="nav-bar__inner">
      {links.map((l) => {
        const active =
          l.href === "/live"
            ? pathname.startsWith("/live")
            : pathname === l.href;
        const isLiveLink = l.href === "/live";
        const showDot = isLiveLink && liveCount > 0;

        return (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition inline-flex items-center gap-2 ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--card)] text-[var(--muted)] hover:text-white"
            }`}
            title={
              showDot ? `${liveCount} match${liveCount === 1 ? "" : "es"} live` : undefined
            }
          >
            {l.label}
            {showDot && <span className="nav-live-dot" aria-hidden />}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
