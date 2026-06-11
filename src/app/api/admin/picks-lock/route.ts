import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getPredictionLockAt, predictionsLockedByTime } from "@/lib/config";
import {
  getPicksUnlockOverride,
  setPicksUnlockOverride,
} from "@/lib/pool-settings";
import { arePredictionsLocked } from "@/lib/predictions-lock";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const overrideRes = await getPicksUnlockOverride();
  if (overrideRes.error) {
    return NextResponse.json({ error: overrideRes.error }, { status: 500 });
  }

  const deadlinePassed = predictionsLockedByTime();
  const picksLocked = await arePredictionsLocked();

  return NextResponse.json({
    deadlinePassed,
    picksLocked,
    picksReopened: deadlinePassed && overrideRes.data,
    lockAt: getPredictionLockAt().toISOString(),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  if (typeof body.reopenPicks !== "boolean") {
    return NextResponse.json(
      { error: "Send { reopenPicks: true } or { reopenPicks: false }." },
      { status: 400 },
    );
  }

  const res = await setPicksUnlockOverride(body.reopenPicks);
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  const picksLocked = await arePredictionsLocked();

  return NextResponse.json({
    ok: true,
    picksReopened: res.data ?? false,
    picksLocked,
    deadlinePassed: predictionsLockedByTime(),
  });
}
