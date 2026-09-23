import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function backendFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return { ok: false as const, status: 401, data: { message: 'Unauthorized' } };
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** GET /api/contents/bundle → full categoryContent-like payload */
export async function GET() {
  const result = await backendFetch('/contents/bundle');
  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to fetch content bundle' },
      { status: result.status },
    );
  }
  return NextResponse.json(result.data);
}
