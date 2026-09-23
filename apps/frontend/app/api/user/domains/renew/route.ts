import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";

type RenewPayload = {
  domainId?: string;
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let body: RenewPayload;
  try {
    body = (await request.json()) as RenewPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  if (!body.domainId) {
    return NextResponse.json({ message: "Domain id is required" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    mock: true,
    message: "Domain renewed for 1 more year.",
    domainId: body.domainId,
    expiresAt: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  });
}
