import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "./config";

export function getAdminPassword(req: NextRequest): string {
  return req.headers.get("x-admin-password") ?? "";
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Wrong admin password" }, { status: 401 });
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!verifyAdminPassword(getAdminPassword(req))) {
    return unauthorized();
  }
  return null;
}
