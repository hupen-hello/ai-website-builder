import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";

function getToken() {
  return cookies().then((cookieStore) => cookieStore.get(USER_TOKEN_COOKIE)?.value);
}

export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const res = await fetch(`${getBackendUrl()}/user-state`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to load saved billing state." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  try {
    const res = await fetch(`${getBackendUrl()}/user-state`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to save billing state." },
      { status: 500 },
    );
  }
}
