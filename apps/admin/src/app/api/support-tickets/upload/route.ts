import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  filesFromFormData,
  saveSupportAttachments,
} from '@/lib/supportUpload';

const COOKIE_NAME = 'admin_token';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!meRes.ok) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const ticketId = String(form.get('ticketId') || 'general');
    const files = filesFromFormData(form);
    if (!files.length) {
      return NextResponse.json(
        { message: 'At least one file is required' },
        { status: 400 },
      );
    }

    const attachments = await saveSupportAttachments(files, ticketId);
    return NextResponse.json({ attachments });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Unable to upload files',
      },
      { status: 400 },
    );
  }
}
