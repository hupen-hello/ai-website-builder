import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(USER_TOKEN_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  const designKey = new URL(request.url).searchParams.get("designKey")?.trim();

  try {
    const path = designKey
      ? `/user/create-ai-designs/${encodeURIComponent(designKey)}`
      : `/user/create-ai-designs`;
    const res = await fetch(`${getBackendUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to load Create-AI designs." },
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
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const res = await fetch(`${getBackendUrl()}/user/create-ai-designs`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to sync Create-AI design." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  const designKey = new URL(request.url).searchParams.get("designKey")?.trim();
  if (!designKey) {
    return NextResponse.json({ message: "designKey is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${getBackendUrl()}/user/create-ai-designs/${encodeURIComponent(designKey)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to delete Create-AI design." },
      { status: 500 },
    );
  }
}
