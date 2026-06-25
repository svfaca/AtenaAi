import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de chat - proxy para backend
 * POST /api/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, language, conversation_id, history } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

    // URL do backend FastAPI
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // 🔑 Extrair cookies do request
    const cookieHeader = request.headers.get("cookie");
    console.log("[/api/chat] Cookie header received:", !!cookieHeader);

    const response = await fetch(`${backendUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 🔑 Repassar cookies do cliente para o backend (para autenticação)
        ...(cookieHeader && { "cookie": cookieHeader }),
      },
      body: JSON.stringify({
        content,
        language: language || 'pt-BR',
        conversation_id,
        history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend error:', response.status, response.statusText, errorData);
      
      // Se 401, provavelmente cookies não foram repassados
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Não autenticado' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          reply: 'Desculpe, não consegui processar sua pergunta no momento. Verifique a conexão ou tente novamente mais tarde.',
          debug: { status: response.status, statusText: response.statusText, error: errorData },
        },
        { status: 200 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      reply: data.reply || data.content || 'Mensagem recebida',
      conversation_id: data.conversation_id,
    });
  } catch (error) {
    console.error('Erro no endpoint de chat:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');

    return NextResponse.json(
      {
        reply: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
