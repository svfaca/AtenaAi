'use client';

import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

type TextMessageProps = {
  content: string;
  role: 'user' | 'assistant';
  strongIntro?: boolean;
};

export default function TextMessage({ content, role, strongIntro = false }: TextMessageProps) {
  const isUser = role === 'user';
  const markdownClasses =
    'text-sm leading-relaxed break-words [&_p]:my-0 [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-slate-900/90 [&_pre]:p-3 [&_pre]:text-slate-100 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em]';

  // Detecta se há pontinhos de carregamento no final
  const hasLoadingDots = content.trimEnd().endsWith('...');
  let displayContent = content;
  let contentWithoutDots = content;

  if (hasLoadingDots) {
    contentWithoutDots = content.trimEnd().slice(0, -3).trimEnd();
  }

  if (strongIntro) {
    const intro = 'Ola! Eu sou a AtenaAI.';
    const rest = displayContent.replace(intro, '').trimStart();

    return (
      <div className="message bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm text-gray-800 dark:text-gray-200">
        <div className="m-0">
          <strong>{intro}</strong>
          {rest ? (
            <>
              <br />
              <div className={markdownClasses}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {rest}
                </ReactMarkdown>
              </div>
            </>
          ) : null}
        </div>
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
        <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap break-words">{displayContent}</p>
      ) : (
        <div className={markdownClasses}>
          {hasLoadingDots ? (
            <div>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {contentWithoutDots}
              </ReactMarkdown>
              <span className="loading-dots"> ...</span>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {displayContent}
            </ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
}

