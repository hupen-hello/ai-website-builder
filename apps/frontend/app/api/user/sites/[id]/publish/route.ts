import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${getBackendUrl()}/sites/${id}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const site = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: site.message || "Publish failed" },
        { status: res.status },
      );
    }

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      id: site.slug,
      slug: site.slug,
      path: `/published/${site.slug}`,
      url: `${origin}/published/${site.slug}`,
      site,
    });
  } catch {
    return NextResponse.json({ message: "Publish failed" }, { status: 500 });
  }
}
