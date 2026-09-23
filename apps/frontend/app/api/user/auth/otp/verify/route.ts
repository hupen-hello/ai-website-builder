import { NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";
import { attachWelcomeCookie } from "@/lib/welcomeSignup";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${getBackendUrl()}/auth/user/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || "Invalid code" },
        { status: res.status },
      );
    }

    const response = NextResponse.json({
      user: data.user,
      isNewUser: Boolean(data.isNewUser),
      message: data.isNewUser ? "Welcome to Lestow" : "Logged in",
    });
    response.cookies.set(USER_TOKEN_COOKIE, data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    attachWelcomeCookie(response, data.isNewUser);
    return response;
  } catch {
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
