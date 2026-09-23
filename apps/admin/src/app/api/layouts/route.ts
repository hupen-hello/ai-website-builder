import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

function withMongoShape<T extends { id: string }>(layout: T) {
  return { ...layout, _id: layout.id };
}

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sectionType = url.searchParams.get('sectionType');
  const qs = sectionType
    ? `?sectionType=${encodeURIComponent(sectionType)}`
    : '';

  const result = await backendFetch(`/layouts${qs}`);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to fetch layouts' },
      { status: result.status },
    );
  }

  const list = Array.isArray(result.data)
    ? result.data.map(withMongoShape)
    : [];
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await backendFetch('/layouts', {
    method: 'POST',
    body: JSON.stringify({
      key: body.key,
      name: body.name,
      sectionType: body.sectionType,
      sectionNumber: body.sectionNumber,
      categorySlug: body.categorySlug,
      scope: body.scope,
      order: body.order,
      status: body.status,
      thumbnailUrl: body.thumbnailUrl,
      description: body.description,
      defaultContent: body.defaultContent,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to create layout' },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      message: 'Layout Created',
      layout: withMongoShape(result.data),
    },
    { status: 201 },
  );
}

export async function PUT(req: Request) {
  const data = await req.json();
  const id = data._id || data.id;
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const { _id, id: _ignored, ...updateData } = data;
  const result = await backendFetch(`/layouts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to update layout' },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: 'Layout Updated',
    layout: withMongoShape(result.data),
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const result = await backendFetch(`/layouts?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to delete layout' },
      { status: result.status },
    );
  }

  return NextResponse.json({ message: 'Layout Deleted' });
}
