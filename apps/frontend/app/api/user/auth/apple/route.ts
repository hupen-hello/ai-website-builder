import { NextResponse } from "next/server";
import {
  encodeOAuthState,
  getAppOrigin,
  oauthErrorRedirect,
} from "@/lib/oauth";

export async function GET(request: Request) {
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  if (!clientId) {
    return oauthErrorRedirect(
      getAppOrigin(request),
      "Apple login is not configured. Add APPLE_CLIENT_ID and related keys.",
    );
  }

  const origin = getAppOrigin(request);
  const url = new URL(request.url);
  const returnPath = url.searchParams.get("return") || "/auth";
  const redirectUri = `${origin}/api/user/auth/apple/callback`;

  const auth = new URL("https://appleid.apple.com/auth/authorize");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code id_token");
  auth.searchParams.set("response_mode", "form_post");
  auth.searchParams.set("scope", "name email");
  auth.searchParams.set("state", encodeOAuthState(returnPath));

  return NextResponse.redirect(auth.toString());
}
