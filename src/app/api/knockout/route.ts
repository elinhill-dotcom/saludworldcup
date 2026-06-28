import { NextResponse } from "next/server";
import { computeKnockoutPageData } from "@/lib/knockout-page-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const res = await computeKnockoutPageData();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load knockout data" },
      { status: 500 },
    );
  }

  return NextResponse.json(res.data);
}
