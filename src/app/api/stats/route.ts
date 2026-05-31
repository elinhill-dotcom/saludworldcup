import { NextResponse } from "next/server";
import { getPredictionLockAt, predictionsLocked } from "@/lib/config";
import { computePoolStats } from "@/lib/pool-stats";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const locked = predictionsLocked();

  if (!locked) {
    return NextResponse.json({
      locked: false,
      lockAt: getPredictionLockAt().toISOString(),
    });
  }

  const res = await computePoolStats();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Could not load stats" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ...res.data, locked: true });
}
