import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend";

/** Public proxy so onboarding can load admin/backend categories. */
export async function GET() {
  try {
    const res = await fetch(`${getBackendUrl()}/categories`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Unable to load categories" },
        { status: res.status },
      );
    }
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json(
      { message: "Unable to load categories" },
      { status: 502 },
    );
  }
}
