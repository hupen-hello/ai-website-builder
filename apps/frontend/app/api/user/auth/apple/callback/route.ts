import {
  completeOAuthLogin,
  createAppleClientSecret,
  decodeJwtPayload,
  decodeOAuthState,
  getAppOrigin,
  oauthErrorRedirect,
} from "@/lib/oauth";

async function handleAppleCallback(request: Request) {
  const origin = getAppOrigin(request);

  let code = "";
  let idToken = "";
  let state = "";
  let userJson = "";

  if (request.method === "POST") {
    const form = await request.formData();
    code = String(form.get("code") || "");
    idToken = String(form.get("id_token") || "");
    state = String(form.get("state") || "");
    userJson = String(form.get("user") || "");
  } else {
    const url = new URL(request.url);
    if (url.searchParams.get("error")) {
      return oauthErrorRedirect(origin, "Apple sign-in was cancelled");
    }
    code = url.searchParams.get("code") || "";
    idToken = url.searchParams.get("id_token") || "";
    state = url.searchParams.get("state") || "";
  }

  const returnPath = decodeOAuthState(state || null);
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  if (!clientId) {
    return oauthErrorRedirect(origin, "Apple login is not configured");
  }

  try {
    let email = "";
    let providerId = "";
    let name: string | null = null;

    if (idToken) {
      const payload = decodeJwtPayload<{
        sub?: string;
        email?: string;
      }>(idToken);
      providerId = payload.sub || "";
      email = payload.email || "";
    }

    if (code) {
      const clientSecret = createAppleClientSecret();
      const redirectUri = `${origin}/api/user/auth/apple/callback`;
      const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });
      const tokenData = (await tokenRes.json().catch(() => ({}))) as {
        id_token?: string;
        error?: string;
      };
      if (tokenRes.ok && tokenData.id_token) {
        const payload = decodeJwtPayload<{
          sub?: string;
          email?: string;
        }>(tokenData.id_token);
        providerId = payload.sub || providerId;
        email = payload.email || email;
      } else if (!providerId) {
        return oauthErrorRedirect(
          origin,
          tokenData.error || "Apple token exchange failed",
        );
      }
    }

    if (userJson) {
      try {
        const parsed = JSON.parse(userJson) as {
          name?: { firstName?: string; lastName?: string };
        };
        const full = [parsed.name?.firstName, parsed.name?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (full) name = full;
      } catch {
        /* ignore */
      }
    }

    if (!providerId || !email) {
      return oauthErrorRedirect(
        origin,
        "Apple did not return email. Use Hide My Email or grant email access.",
      );
    }

    return completeOAuthLogin(
      origin,
      {
        provider: "apple",
        providerId,
        email,
        name,
        avatarUrl: null,
      },
      returnPath,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Apple sign-in failed";
    return oauthErrorRedirect(origin, message);
  }
}

export async function GET(request: Request) {
  return handleAppleCallback(request);
}

export async function POST(request: Request) {
  return handleAppleCallback(request);
}
