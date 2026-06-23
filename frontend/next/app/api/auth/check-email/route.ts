import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para verificar se um email já está registrado
 * POST /api/auth/check-email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // URL do backend FastAPI
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/v1/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      console.error('Backend error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Erro ao verificar email' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      available: data.available !== false,
    });
  } catch (error) {
    console.error('Erro ao verificar email:', error);

    return NextResponse.json(
      {
        error: 'Erro ao verificar email',
        exists: false,
      },
      { status: 500 }
    );
  }
}
