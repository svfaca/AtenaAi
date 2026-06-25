import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    console.log('[/api/auth/me] Validating session...');

    // Extrair cookie do request
    const cookieHeader = request.headers.get('cookie');
    console.log('[/api/auth/me] Cookie header received:', !!cookieHeader);

    // Chamar backend para validar sessão
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Passar os cookies do request para o backend
        ...(cookieHeader && { 'cookie': cookieHeader }),
      },
      credentials: 'include', // ⚠️ IMPORTANTE: Incluir cookies na requisição
    });

    console.log('[/api/auth/me] Backend response:', response.status);

    if (!response.ok) {
      console.log('[/api/auth/me] Not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userData = await response.json();
    
    console.log('[/api/auth/me] User data:', {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      interests: userData.interests,
    });

    return NextResponse.json({
      user: {
        id: userData.id || 'unknown',
        email: userData.email,
        full_name: userData.full_name || userData.name || 'Usuário',
        name: userData.full_name || userData.name || 'Usuário', // compatibilidade
        nickname: userData.nickname || '',
        role: userData.role || 'student',
        profile_image: userData.profile_image || undefined,
        interests: userData.interests || [],
        birth_date: userData.birth_date || undefined,
        gender: userData.gender || undefined,
        avatar: userData.avatar || undefined,
      },
    });
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
