import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";

async function getUserToken() {
  const cookieStore = await cookies();
  return cookieStore.get(USER_TOKEN_COOKIE)?.value;
}

export async function POST(request: Request) {
  const token = await getUserToken();
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const contentType =
      request.headers.get("content-type") || "application/json";
    const fetchOptions: RequestInit & { duplex: "half" } = {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${token}`,
      },
      // Required by Node when forwarding a streaming request body.
      duplex: "half",
      body: request.body,
    };
    const res = await fetch(`${getBackendUrl()}/sites/migrate`, fetchOptions);
    const rawText = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      const apiMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : typeof data.message === "string"
          ? data.message
          : "";
      const rawFallback =
        typeof rawText === "string" && rawText.trim().length > 0
          ? rawText.trim().slice(0, 220)
          : "";
      const message =
        apiMessage ||
        rawFallback ||
        (res.status === 413
          ? "Site content is too large to save. Try using smaller images."
          : "Unable to save site");
      return NextResponse.json({ message }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Unable to save site" }, { status: 500 });
  }
}
