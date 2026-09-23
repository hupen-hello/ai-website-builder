import {
  completeOAuthLogin,
  decodeOAuthState,
  getAppOrigin,
  oauthErrorRedirect,
} from "@/lib/oauth";

export async function GET(request: Request) {
  const origin = getAppOrigin(request);
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return oauthErrorRedirect(origin, "Google sign-in was cancelled");
  }

  const code = url.searchParams.get("code");
  const returnPath = decodeOAuthState(url.searchParams.get("state"));
  if (!code) {
    return oauthErrorRedirect(origin, "Missing Google authorization code");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return oauthErrorRedirect(
      origin,
      "Google login is not configured on the server",
    );
  }

  const redirectUri = `${origin}/api/user/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = (await tokenRes.json().catch(() => ({}))) as {
      access_token?: string;
      error_description?: string;
    };
    if (!tokenRes.ok || !tokenData.access_token) {
      return oauthErrorRedirect(
        origin,
        tokenData.error_description || "Google token exchange failed",
      );
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: "no-store",
      },
    );
    const profile = (await profileRes.json().catch(() => ({}))) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };

    if (!profileRes.ok || !profile.sub || !profile.email) {
      return oauthErrorRedirect(origin, "Could not read Google profile");
    }

    return completeOAuthLogin(
      origin,
      {
        provider: "google",
        providerId: profile.sub,
        email: profile.email,
        name: profile.name || null,
        avatarUrl: profile.picture || null,
      },
      returnPath,
    );
  } catch {
    return oauthErrorRedirect(origin, "Google sign-in failed");
  }
}
