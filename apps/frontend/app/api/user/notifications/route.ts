import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const limit = request.nextUrl.searchParams.get("limit");
    const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";
    const res = await fetch(`${getBackendUrl()}/user/notifications${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to load notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      all?: boolean;
    };
    const path = body.all
      ? "/user/notifications/read-all"
      : body.id
        ? `/user/notifications/${encodeURIComponent(body.id)}/read`
        : null;
    if (!path) {
      return NextResponse.json(
        { message: "Notification id or all=true is required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${getBackendUrl()}${path}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to update notifications" },
      { status: 500 },
    );
  }
}
