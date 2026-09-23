import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';

const COOKIE_NAME = 'admin_token';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('avatar');

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Avatar file is required' }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { message: 'Only JPG, PNG, WEBP, or GIF images are allowed' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: 'Image must be 2MB or smaller' },
      { status: 400 },
    );
  }

  const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const me = await meRes.json().catch(() => ({}));
  if (!meRes.ok || !me.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'image/gif'
          ? 'gif'
          : 'jpg';

  const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(dir, { recursive: true });

  // Remove previous known extensions for this admin
  for (const oldExt of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
    try {
      await unlink(path.join(dir, `${me.id}.${oldExt}`));
    } catch {
      // ignore missing
    }
  }

  const filename = `${me.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;

  const patchRes = await fetch(`${BACKEND_URL}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ avatarUrl }),
  });

  const data = await patchRes.json().catch(() => ({}));
  if (!patchRes.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to save avatar' },
      { status: patchRes.status },
    );
  }

  return NextResponse.json(data);
}
