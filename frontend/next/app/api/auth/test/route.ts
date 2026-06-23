import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    
    console.log('[/api/auth/test] Checking token:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length,
      allCookies: request.cookies.getAll().map(c => c.name),
    });

    if (!accessToken) {
      return NextResponse.json(
        { 
          authenticated: false, 
          message: 'No access_token cookie found',
          cookies: request.cookies.getAll().map(c => ({ name: c.name, length: c.value.length })),
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      tokenLength: accessToken.length,
      message: 'Token found',
    });
  } catch (error) {
    console.error('[/api/auth/test] Error:', error);
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
}
