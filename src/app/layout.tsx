import type { Metadata } from "next";
import "./globals.css";
import { FootballDecor } from "@/components/FootballDecor";
import { Nav } from "@/components/Nav";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "World Cup 2026 — Salud Office Pool",
  description: "Predict group scores and knockout teams — €10 in the jar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <FootballDecor />
        <div className="app-shell app-shell--wide mx-auto max-w-3xl px-4 py-8">
          <SiteHeader />
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
