import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

const COOKIE_NAME = 'admin_token';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const categorySlug = String(form.get('category') || 'shared')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '');

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { message: 'Only JPG, PNG, WEBP, or GIF images are allowed' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: 'Image must be 5MB or smaller' },
      { status: 400 },
    );
  }

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'image/gif'
          ? 'gif'
          : 'jpg';

  // Write into frontend public so compose/layout previews can serve the file
  const dir = path.join(
    process.cwd(),
    '..',
    'frontend',
    'public',
    'uploads',
    'content',
    categorySlug || 'shared',
  );
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/content/${categorySlug || 'shared'}/${filename}`;
  return NextResponse.json({ url });
}
