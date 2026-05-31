"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/picks", label: "My picks" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/results", label: "Results" },
  { href: "/live", label: "Live chat" },
] as const;

const statsLink = {
  href: "/stats",
  label: "How has Salud bet?",
} as const;

export function Nav() {
  const pathname = usePathname();
  const [liveCount, setLiveCount] = useState(0);
  const [picksLocked, setPicksLocked] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch("/api/matches/live")
        .then((r) => r.json())
        .then((d) => setLiveCount(d.count ?? 0));
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loadConfig = () =>
      fetch("/api/config")
        .then((r) => r.json())
        .then((d) => setPicksLocked(d.locked ?? false));
    loadConfig();
    const id = setInterval(loadConfig, 60000);
    return () => clearInterval(id);
  }, []);

  const links = useMemo(() => {
    if (!picksLocked) return [...baseLinks];
    return [
      baseLinks[0],
      baseLinks[1],
      baseLinks[2],
      statsLink,
      ...baseLinks.slice(3),
    ];
  }, [picksLocked]);

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
                showDot
                  ? `${liveCount} match${liveCount === 1 ? "" : "es"} live`
                  : undefined
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
