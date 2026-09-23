import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";

async function getUserToken() {
  const cookieStore = await cookies();
  return cookieStore.get(USER_TOKEN_COOKIE)?.value;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getUserToken();
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${getBackendUrl()}/sites/${id}/title`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || "Unable to rename website" },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Unable to rename website" },
      { status: 500 },
    );
  }
}
