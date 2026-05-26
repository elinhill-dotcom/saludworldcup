import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/config";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
