import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { verifyAdminPassword } from "@/lib/config";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import {
  loadKnockoutAnswer,
  saveKnockoutAnswer,
} from "@/lib/supabase-predictions";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ALL_TEAMS } from "@/lib/teams";

const validTeams = new Set<string>(ALL_TEAMS);

function sanitizeTeam(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  return validTeams.has(v) ? v : "";
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const res = await loadKnockoutAnswer();
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  return NextResponse.json({ answer: res.data });
}

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const form: KnockoutFormState & { set?: boolean } = {
    sf1Home: sanitizeTeam(body.sf1Home),
    sf1Away: sanitizeTeam(body.sf1Away),
    sf2Home: sanitizeTeam(body.sf2Home),
    sf2Away: sanitizeTeam(body.sf2Away),
    finalHome: sanitizeTeam(body.finalHome),
    finalAway: sanitizeTeam(body.finalAway),
    bronzeHome: sanitizeTeam(body.bronzeHome),
    bronzeAway: sanitizeTeam(body.bronzeAway),
    champion: sanitizeTeam(body.champion),
    set: true,
  };

  const saveRes = await saveKnockoutAnswer(form);
  if (saveRes.error) {
    return NextResponse.json({ error: saveRes.error }, { status: 500 });
  }

  const loadRes = await loadKnockoutAnswer();
  return NextResponse.json({ answer: loadRes.data });
}
