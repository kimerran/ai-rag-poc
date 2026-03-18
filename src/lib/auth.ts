import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { AuthUser } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY ?? "86400", 10);
const COOKIE_NAME = "rag-session";

export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: JWT_EXPIRY,
    path: "/",
  });
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw new AuthError(401, "UNAUTHORIZED", "Not authenticated");
  const user = await verifyToken(token);
  if (!user) throw new AuthError(401, "UNAUTHORIZED", "Invalid or expired session");
  return user;
}

export async function getAuthUserFromCookies(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export class AuthError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}
