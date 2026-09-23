import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Avatar file is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, WEBP, or GIF images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "Image must be 2MB or smaller" },
        { status: 400 },
      );
    }

    const meRes = await fetch(`${getBackendUrl()}/auth/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const me = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !me.id) {
      return NextResponse.json({ message: "Login required" }, { status: 401 });
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";

    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });

    for (const oldExt of ["jpg", "jpeg", "png", "webp", "gif"]) {
      try {
        await unlink(path.join(dir, `${me.id}.${oldExt}`));
      } catch {
        /* ignore missing */
      }
    }

    const filename = `${me.id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    const avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;

    const patchRes = await fetch(`${getBackendUrl()}/auth/user/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ avatarUrl }),
    });
    const data = await patchRes.json().catch(() => ({}));
    if (!patchRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to save avatar" },
        { status: patchRes.status },
      );
    }

    const response = NextResponse.json({
      user: data.user,
      avatarUrl,
      message: "Avatar updated",
    });

    if (data.accessToken) {
      response.cookies.set(USER_TOKEN_COOKIE, data.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to upload avatar" },
      { status: 500 },
    );
  }
}
