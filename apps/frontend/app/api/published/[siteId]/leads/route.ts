import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ siteId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { siteId } = await context.params;
  const slug = decodeURIComponent(siteId).trim();

  if (!slug) {
    return NextResponse.json({ message: "Site not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const res = await fetch(
      `${getBackendUrl()}/sites/public/${encodeURIComponent(slug)}/leads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || "Unable to submit form" },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Unable to submit form" },
      { status: 500 },
    );
  }
}
