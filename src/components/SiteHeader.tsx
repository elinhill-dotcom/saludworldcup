"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 4 L14.2 9.2 L19.6 9.6 L15.4 13.2 L16.8 18.4 L12 15.6 L7.2 18.4 L8.6 13.2 L4.4 9.6 L9.8 9.2 Z"
        stroke="currentColor"
        strokeWidth="0.9"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const adminActive = pathname.startsWith("/admin");

  return (
    <header className="site-header">
      <div className="site-header__brand">
        <Image
          src="/salud-logo.png"
          alt="Salud Foodgroup Europe"
          width={220}
          height={72}
          className="site-header__logo"
          priority
        />
        <Link
          href="/admin"
          className={`site-header__admin ${adminActive ? "site-header__admin--active" : ""}`}
          title="Admin"
          aria-label="Admin"
        >
          <AdminIcon />
        </Link>
      </div>

      <div className="site-header__title-block">
        <div className="site-header__title-row">
          <FootballIcon className="site-header__football-icon" />
          <h1 className="site-header__title">FIFA World Cup 2026</h1>
          <FootballIcon className="site-header__football-icon site-header__football-icon--flip" />
        </div>
        <p className="site-header__tagline">
          <span className="site-header__pitch-mark" aria-hidden />
          Office pool · €10 in the jar · CEST
        </p>
      </div>
    </header>
  );
}
