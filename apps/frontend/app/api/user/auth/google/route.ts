import { NextResponse } from "next/server";
import {
  encodeOAuthState,
  getAppOrigin,
  oauthErrorRedirect,
} from "@/lib/oauth";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return oauthErrorRedirect(
      getAppOrigin(request),
      "Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }

  const origin = getAppOrigin(request);
  const url = new URL(request.url);
  const returnPath = url.searchParams.get("return") || "/auth";
  const redirectUri = `${origin}/api/user/auth/google/callback`;

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("access_type", "online");
  auth.searchParams.set("prompt", "select_account");
  auth.searchParams.set("state", encodeOAuthState(returnPath));

  return NextResponse.redirect(auth.toString());
}
