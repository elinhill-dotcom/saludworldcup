import { NextRequest, NextResponse } from "next/server";
import { lookupPlayerByName } from "@/lib/supabase-players";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const name = req.nextUrl.searchParams.get("name") ?? "";
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return NextResponse.json({ exists: false, hasPassword: false });
  }

  const res = await lookupPlayerByName(trimmed);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Lookup failed" },
      { status: 500 },
    );
  }

  return NextResponse.json(res.data);
}
