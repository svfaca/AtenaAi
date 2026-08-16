'use client';

import MarkdownContent from './MarkdownContent';

type TextMessageProps = {
  content: string;
  role: 'user' | 'assistant';
  strongIntro?: boolean;
  status?: 'sending' | 'streaming' | 'done' | 'error';
};

// Reconhece a apresentação da AtenaAI (aceita "Ola!" ou "Olá!") para exibi-la em negrito
const INTRO_PATTERN = /^Ol[áa]!?\s+Eu\s+sou\s+a\s+AtenaAI\.?\s*/i;

function extractIntro(content: string): { intro: string; rest: string } {
  const match = content.match(INTRO_PATTERN);
  if (!match) return { intro: '', rest: content };
  return { intro: match[0].trim(), rest: content.slice(match[0].length) };
}

export default function TextMessage({ content, role, strongIntro = false, status }: TextMessageProps) {
  const isUser = role === 'user';

  // Remove espaços sobrando das bordas para o texto colar no balão
  const cleanContent = content.trim();

  // Mostra animação de "..." enquanto o assistant ainda não recebeu o primeiro token
  const showTypingDots =
    !isUser && cleanContent.length === 0 && (status === 'streaming' || status === undefined);

  if (showTypingDots) {
    return (
      <div className="message bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm text-gray-800 dark:text-gray-200">
        <div className="typing-indicator" role="status" aria-label="AtenaAI está digitando">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    );
  }

  // Durante o stream, o backend pode emitir "..." como placeholder antes do conteúdo real
  const hasLoadingDots = cleanContent.endsWith('...');
  const contentWithoutDots = hasLoadingDots ? cleanContent.slice(0, -3).trimEnd() : cleanContent;

  if (strongIntro) {
    const { intro, rest } = extractIntro(cleanContent);

    return (
      <div className="message bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm text-gray-800 dark:text-gray-200">
        {intro && <strong className="mb-1 block">{intro}</strong>}
        {rest ? <MarkdownContent content={rest} className={intro ? 'mt-1' : undefined} /> : null}
      </div>
    );
  }

  return (
    <div
      className={`message p-4 rounded-lg shadow-sm ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      }`}
    >
      {isUser ? (
        <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap break-words">{cleanContent}</p>
      ) : (
        <MarkdownContent
          content={hasLoadingDots ? contentWithoutDots : cleanContent}
          suffix={hasLoadingDots ? <span className="loading-dots"> ...</span> : undefined}
        />
      )}
    </div>
  );
}

