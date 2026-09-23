import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

function withMongoShape<T extends { id: string }>(row: T) {
  return { ...row, _id: row.id };
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

export async function GET() {
  const result = await backendFetch('/contents/categories');
  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to fetch category contents' },
      { status: result.status },
    );
  }

  const list = Array.isArray(result.data)
    ? result.data.map(withMongoShape)
    : [];
  return NextResponse.json(list);
}

export async function PUT(req: Request) {
  const data = await req.json();
  const id = data._id || data.id;
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const { _id, id: _ignored, ...rest } = data;
  const result = await backendFetch(`/contents/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      categorySlug: rest.categorySlug,
      categoryName: rest.categoryName,
      templateKeys: rest.templateKeys,
      sections: rest.sections,
      status: rest.status,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to update category content' },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: 'Category content updated',
    categoryContent: withMongoShape(result.data),
  });
}
