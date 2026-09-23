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
    const requestUrl = new URL(request.url);
    const id = requestUrl.searchParams.get('id')?.trim();
    const search = requestUrl.searchParams.get('search')?.trim();
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const backendPath = id
      ? `/admin/users/${encodeURIComponent(id)}`
      : `/admin/users${query}`;
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Unable to load users' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: 'Unable to load users. Is the backend running?' },
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
      status?: string;
      action?: string;
      siteId?: string;
      cycle?: string;
      days?: number;
    };
    if (!body.id) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const isPlanAction =
      body.action === 'assign' ||
      body.action === 'extend' ||
      body.action === 'cancel';

    const response = await fetch(
      isPlanAction
        ? `${BACKEND_URL}/admin/users/${encodeURIComponent(body.id)}/plans`
        : `${BACKEND_URL}/admin/users/${encodeURIComponent(body.id)}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          isPlanAction
            ? {
                action: body.action,
                siteId: body.siteId,
                cycle: body.cycle,
                days: body.days,
              }
            : { status: body.status },
        ),
      },
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to update user' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const token = await getAdminToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/admin/users/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to delete user' },
      { status: 500 },
    );
  }
}
