import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend";

export async function GET() {
  try {
    const res = await fetch(`${getBackendUrl()}/sites/public`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
