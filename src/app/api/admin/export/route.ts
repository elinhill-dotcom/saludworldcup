import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/config";
import {
  buildPicksCsv,
  buildPicksPrintHtml,
  fetchExportData,
} from "@/lib/export-picks";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password") ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong admin password" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  const res = await fetchExportData();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Export failed" },
      { status: 500 },
    );
  }

  const { matches, rows } = res.data;
  const date = new Date().toISOString().slice(0, 10);

  if (format === "pdf" || format === "html") {
    const html = buildPicksPrintHtml(matches, rows);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="world-cup-picks-${date}.html"`,
      },
    });
  }

  const csv = buildPicksCsv(matches, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="world-cup-picks-${date}.csv"`,
    },
  });
}
