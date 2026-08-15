import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-110f3.up.railway.app';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const cookieHeader = req.headers.get('cookie');

    // Forward do upload para o FastAPI backend
    const response = await fetch(`${API_URL}/api/v1/users/upload-avatar`, {
      method: 'POST',
      headers: {
        ...(cookieHeader && { cookie: cookieHeader }),
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[/api/user/upload-avatar] Error:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload de avatar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');

    const response = await fetch(`${API_URL}/api/v1/users/avatar`, {
      method: 'DELETE',
      headers: {
        ...(cookieHeader && { cookie: cookieHeader }),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[/api/user/upload-avatar] DELETE Error:', error);
    return NextResponse.json({ error: 'Erro ao remover avatar' }, { status: 500 });
  }
}
