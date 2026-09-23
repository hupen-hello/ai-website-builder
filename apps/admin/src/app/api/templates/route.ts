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
  const result = await backendFetch('/templates');
  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to fetch templates' },
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
  const result = await backendFetch('/templates', {
    method: 'POST',
    body: JSON.stringify({
      key: body.key,
      numericId: body.numericId,
      title: body.title ?? body.name,
      type: body.type,
      image: body.image,
      previewImage: body.previewImage ?? body.previewimage,
      previewDescription:
        body.previewDescription ?? body.preview_description,
      prebuiltPages: body.prebuiltPages ?? body.prebuilt_pages,
      pages: body.pages,
      sectionVariants: body.sectionVariants ?? body.selectedLayouts,
      homeSectionOrder: body.homeSectionOrder,
      variables: body.variables,
      order: body.order,
      status: body.status,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to create template' },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      message: 'Template Created',
      template: withMongoShape(result.data),
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

  const { _id, id: _ignored, ...rest } = data;
  const result = await backendFetch(`/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      key: rest.key,
      numericId: rest.numericId,
      title: rest.title ?? rest.name,
      type: rest.type,
      image: rest.image,
      previewImage: rest.previewImage ?? rest.previewimage,
      previewDescription:
        rest.previewDescription ?? rest.preview_description,
      prebuiltPages: rest.prebuiltPages ?? rest.prebuilt_pages,
      pages: rest.pages,
      sectionVariants: rest.sectionVariants ?? rest.selectedLayouts,
      homeSectionOrder: rest.homeSectionOrder,
      variables: rest.variables,
      order: rest.order,
      status: rest.status,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to update template' },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: 'Template Updated',
    template: withMongoShape(result.data),
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const result = await backendFetch(`/templates?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.message || 'Failed to delete template' },
      { status: result.status },
    );
  }

  return NextResponse.json({ message: 'Template Deleted' });
}
