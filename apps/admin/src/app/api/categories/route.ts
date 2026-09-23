import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

function withMongoShape<T extends { id: string }>(category: T) {
  return { ...category, _id: category.id };
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
  const result = await backendFetch('/categories');
  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to fetch categories' },
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
  const result = await backendFetch('/categories', {
    method: 'POST',
    body: JSON.stringify({
      order: body.order,
      name: body.name,
      slug: body.slug,
      icon: body.icon,
      description: body.description,
      status: body.status,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to create category' },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      message: 'Category Created',
      category: withMongoShape(result.data),
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
  const result = await backendFetch(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to update category' },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: 'Category Updated',
    category: withMongoShape(result.data),
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const result = await backendFetch(`/categories?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to delete category' },
      { status: result.status },
    );
  }

  return NextResponse.json({ message: 'Category Deleted' });
}
