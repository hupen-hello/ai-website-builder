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
    const status = requestUrl.searchParams.get('status')?.trim();
    const category = requestUrl.searchParams.get('category')?.trim();

    if (id) {
      const response = await fetch(
        `${BACKEND_URL}/admin/support-tickets/${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        },
      );
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${BACKEND_URL}/admin/support-tickets${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to load support tickets. Is the backend running?' },
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
      message?: string;
      reply?: boolean;
      attachments?: Array<{
        name?: string;
        url?: string;
        size?: number;
        mimeType?: string;
      }>;
    };
    if (!body.id) {
      return NextResponse.json({ message: 'Ticket ID is required' }, { status: 400 });
    }

    if (body.reply || body.message || (body.attachments && body.attachments.length)) {
      const response = await fetch(
        `${BACKEND_URL}/admin/support-tickets/${encodeURIComponent(body.id)}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: body.message,
            status: body.status,
            attachments: body.attachments,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    const response = await fetch(
      `${BACKEND_URL}/admin/support-tickets/${encodeURIComponent(body.id)}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: body.status }),
      },
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to update ticket' },
      { status: 500 },
    );
  }
}
