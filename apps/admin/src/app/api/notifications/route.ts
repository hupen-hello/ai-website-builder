import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function getAdminToken() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function GET(request: Request) {
  const token = await getAdminToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const query = limit ? `?limit=${encodeURIComponent(limit)}` : '';
    const response = await fetch(`${BACKEND_URL}/admin/notifications${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to load notifications' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const token = await getAdminToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      all?: boolean;
    };

    const path = body.all
      ? '/admin/notifications/read-all'
      : body.id
        ? `/admin/notifications/${encodeURIComponent(body.id)}/read`
        : null;

    if (!path) {
      return NextResponse.json(
        { message: 'Notification id or all=true is required' },
        { status: 400 },
      );
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to update notifications' },
      { status: 500 },
    );
  }
}
