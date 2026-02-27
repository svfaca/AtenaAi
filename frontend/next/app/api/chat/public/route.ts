import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de chat público
 * POST /api/chat/public
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

    // Fazer chamada ao backend FastAPI
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/chat/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      // Se o backend não está disponível, retorna uma resposta padrão
      if (!response.ok) {
        return NextResponse.json(
          {
            response: `Desculpe, não consegui processar sua pergunta no momento. Verifique a conexão ou tente novamente mais tarde.`,
          },
          { status: 200 }
        );
      }
    }

    const data = await response.json();

    return NextResponse.json({
      response: data.response || data.message || 'Mensagem recebida',
      conversationId,
    });
  } catch (error) {
    console.error('Erro no endpoint de chat público:', error);

    return NextResponse.json(
      {
        response: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
