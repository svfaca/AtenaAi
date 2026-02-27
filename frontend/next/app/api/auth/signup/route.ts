import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      nickname,
      birth_date,
      gender,
      interests,
      profile_image,
    } = body;

    // Validações básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // URL do backend FastAPI
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name: name,
        nickname: nickname || null,
        birth_date: birth_date || null,
        gender: gender || null,
        interests: interests ? JSON.stringify(interests) : null,
        profile_image: profile_image || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend signup error:', response.status, errorData);

      return NextResponse.json(
        {
          message: errorData.detail || 'Erro ao criar conta',
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Criar resposta com cookie de autenticação
    const result = NextResponse.json({
      user: {
        id: data.user?.id || 'unknown',
        email: data.user?.email || email,
        name: data.user?.full_name || data.user?.name || name,
        role: data.user?.role || 'scholar',
      },
      message: 'Conta criada com sucesso',
    });

    // Salvar token de acesso em cookie HttpOnly se fornecido
    if (data.access_token) {
      result.cookies.set('access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 horas em segundos
        path: '/',
      });
    }

    return result;
  } catch (error) {
    console.error('Signup error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        message: 'Erro ao processar cadastro: ' + errorMsg,
      },
      { status: 500 }
    );
  }
}
