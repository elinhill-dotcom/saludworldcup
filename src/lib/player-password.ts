import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const MIN_PASSWORD_LENGTH = 4;
export const MAX_PASSWORD_LENGTH = 128;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return "Password is too long.";
  }
  return null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expected] = parts;
  const actual = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(
      Buffer.from(actual, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
