import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { arePredictionsLocked } from "@/lib/predictions-lock";
import { predictionsLockedByTime } from "@/lib/config";
import { setPlayerPicksUnlockOverride } from "@/lib/pool-settings";
import { clearPlayerPicks } from "@/lib/supabase-predictions";
import {
  clearPlayerPassword,
  deletePlayer,
  fetchAdminPlayers,
  findPlayerById,
  isPlayerNameTaken,
  renamePlayer,
} from "@/lib/supabase-players";
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

  const res = await fetchAdminPlayers();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load players" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    locked: await arePredictionsLocked(),
    deadlinePassed: predictionsLockedByTime(),
    players: res.data,
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
  const playerId = body.playerId as string | undefined;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!playerId || name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Invalid name or player" }, { status: 400 });
  }

  const takenRes = await isPlayerNameTaken(name, playerId);
  if (takenRes.error) {
    return NextResponse.json({ error: takenRes.error }, { status: 500 });
  }
  if (takenRes.data) {
    return NextResponse.json(
      { error: "That name is already taken." },
      { status: 409 },
    );
  }

  const res = await renamePlayer(playerId, name);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Player not found" },
      { status: res.error?.includes("not found") ? 404 : 500 },
    );
  }

  return NextResponse.json({ player: res.data });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const playerId = req.nextUrl.searchParams.get("playerId");

  if (typeof playerId !== "string" || !playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const res = await deletePlayer(playerId);
  if (res.error) {
    return NextResponse.json(
      { error: res.error },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  if (body.action === "reset-password") {
    const playerRes = await findPlayerById(playerId);
    if (playerRes.error) {
      return NextResponse.json({ error: playerRes.error }, { status: 500 });
    }
    if (!playerRes.data) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const resetRes = await clearPlayerPassword(playerId);
    if (resetRes.error) {
      return NextResponse.json({ error: resetRes.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "set-picks-unlock") {
    if (!predictionsLockedByTime()) {
      return NextResponse.json(
        { error: "Deadline has not passed — picks are already open for everyone." },
        { status: 400 },
      );
    }

    if (typeof body.reopenPicks !== "boolean") {
      return NextResponse.json(
        { error: "Send reopenPicks: true or false." },
        { status: 400 },
      );
    }

    const playerRes = await findPlayerById(playerId);
    if (playerRes.error) {
      return NextResponse.json({ error: playerRes.error }, { status: 500 });
    }
    if (!playerRes.data) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const unlockRes = await setPlayerPicksUnlockOverride(
      playerId,
      body.reopenPicks,
    );
    if (unlockRes.error) {
      return NextResponse.json({ error: unlockRes.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      picksReopened: unlockRes.data ?? false,
    });
  }

  if (body.action !== "clear-picks") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (await arePredictionsLocked(playerId)) {
    return NextResponse.json(
      { error: "Picks are locked — cannot clear picks after kickoff." },
      { status: 403 },
    );
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const clearRes = await clearPlayerPicks(playerId);
  if (clearRes.error) {
    return NextResponse.json({ error: clearRes.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
