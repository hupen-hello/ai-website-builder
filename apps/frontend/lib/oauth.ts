import { createPrivateKey, sign } from "crypto";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";
import { NextResponse } from "next/server";
import { attachWelcomeCookie } from "@/lib/welcomeSignup";

export type OAuthProvider = "google" | "apple";

export function getAppOrigin(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;
  if (configured?.trim()) return configured.trim().replace(/\/$/, "");
  return new URL(request.url).origin;
}

export function oauthErrorRedirect(origin: string, message: string) {
  const url = new URL("/auth", origin);
  url.searchParams.set("oauth_error", message);
  return NextResponse.redirect(url);
}

export async function completeOAuthLogin(
  origin: string,
  profile: {
    provider: OAuthProvider;
    providerId: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  },
  returnPath = "/auth",
) {
  const res = await fetch(`${getBackendUrl()}/auth/user/oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return oauthErrorRedirect(
      origin,
      data.message || "Social login failed",
    );
  }

  const safeReturn =
    typeof returnPath === "string" &&
    returnPath.startsWith("/") &&
    !returnPath.startsWith("//")
      ? returnPath
      : "/auth";

  const response = NextResponse.redirect(new URL(safeReturn, origin));
  response.cookies.set(USER_TOKEN_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  attachWelcomeCookie(response, data.isNewUser);
  return response;
}

function base64Url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Apple requires a short-lived ES256 JWT as client_secret. */
export function createAppleClientSecret() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!teamId || !clientId || !keyId || !privateKey) {
    throw new Error(
      "Apple Sign In is not configured (APPLE_CLIENT_ID / TEAM_ID / KEY_ID / PRIVATE_KEY)",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(
    JSON.stringify({ alg: "ES256", kid: keyId }),
  );
  const payload = base64Url(
    JSON.stringify({
      iss: teamId,
      iat: now,
      exp: now + 60 * 60 * 24 * 180,
      aud: "https://appleid.apple.com",
      sub: clientId,
    }),
  );
  const data = `${header}.${payload}`;
  const key = createPrivateKey(privateKey);
  const signature = sign("SHA256", Buffer.from(data), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `${data}.${base64Url(signature)}`;
}

export function decodeJwtPayload<T extends Record<string, unknown>>(
  token: string,
): T {
  const part = token.split(".")[1];
  if (!part) throw new Error("Invalid token");
  const json = Buffer.from(
    part.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf8");
  return JSON.parse(json) as T;
}

export function encodeOAuthState(returnPath?: string | null) {
  const payload = JSON.stringify({
    r: returnPath || "/auth",
    n: Math.random().toString(36).slice(2),
  });
  return base64Url(payload);
}

export function decodeOAuthState(state: string | null): string {
  if (!state) return "/auth";
  try {
    const json = Buffer.from(
      state.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const parsed = JSON.parse(json) as { r?: string };
    if (
      typeof parsed.r === "string" &&
      parsed.r.startsWith("/") &&
      !parsed.r.startsWith("//")
    ) {
      return parsed.r;
    }
  } catch {
    /* ignore */
  }
  return "/auth";
}
