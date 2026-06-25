import { NextRequest, NextResponse } from 'next/server';
import type { LoginRequest, AuthUser } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validar input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Chamar backend FastAPI
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    // Enviar como form-data para OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', body.email);
    formData.append('password', body.password);

    console.log('[Auth] Calling backend:', `${backendUrl}/api/v1/auth/login`);

    const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      credentials: 'include', // Incluir cookies na requisição
    });

    console.log('[Auth] Backend response status:', response.status);
    
    // Verificar headers de resposta, incluindo Set-Cookie
    console.log('[Auth] Response headers:');
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        console.log(`  ${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.detail || 'Falha ao fazer login' },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('[Auth] Backend returned user:', {
      id: data.user?.id,
      email: data.user?.email,
      role: data.user?.role,
    });

    // Criar resposta com dados do usuário
    const result = NextResponse.json({
      user: {
        id: data.user?.id || 'unknown',
        email: data.user?.email || body.email,
        name: data.user?.full_name || data.user?.name || 'Usuário',
        role: data.user?.role || 'student',
      },
      message: data.message || 'Login realizado com sucesso',
    });

    // ⚠️ IMPORTANTE: Copiar o Set-Cookie header do backend para a resposta do cliente
    // Isso é necessário porque fetch() não passa cookies automaticamente
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('[Auth] Copying Set-Cookie from backend to response');
      result.headers.set('Set-Cookie', setCookieHeader);
    } else {
      console.warn('[Auth] No Set-Cookie header from backend');
    }

    console.log('[Auth] Login response complete');

    return result;
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { message: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
