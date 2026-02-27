import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    await clearSessionCookie();

    return NextResponse.json(
      { message: 'Logout realizado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}
