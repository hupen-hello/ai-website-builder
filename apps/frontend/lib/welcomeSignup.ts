import { NextResponse } from "next/server";

export const WELCOME_COOKIE = "lestow-welcome";

export function attachWelcomeCookie(response: NextResponse, isNewUser?: boolean) {
  if (!isNewUser) return response;
  response.cookies.set(WELCOME_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 5,
  });
  return response;
}

export function consumeWelcomePending() {
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${WELCOME_COOKIE}=`));
  if (!match) return false;
  document.cookie = `${WELCOME_COOKIE}=; Max-Age=0; path=/`;
  return true;
}
