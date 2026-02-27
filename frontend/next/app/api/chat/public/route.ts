import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de chat público
 * POST /api/chat/public
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, history, language } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

    // Backend FastAPI usa /api/v1/chat com suporte a visitante
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
        language: language || 'pt-BR',
        conversation_id: conversationId,
        history,
      }),
    });

    // Mantém chat público resiliente mesmo com falha no backend
    if (!response.ok) {
      return NextResponse.json(
        {
          response:
            'Desculpe, não consegui processar sua pergunta no momento. Verifique a conexão ou tente novamente mais tarde.',
        },
        { status: 200 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      response: data.reply || data.response || data.message || 'Mensagem recebida',
      conversationId: data.conversation_id || conversationId,
    });
  } catch (error) {
    console.error('Erro no endpoint de chat público:', error);

    return NextResponse.json(
      {
        response: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
      },
      { status: 200 }
    );
  }
}
