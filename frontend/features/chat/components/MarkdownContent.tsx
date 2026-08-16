'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// Tipografia padrão para o conteúdo Markdown exibido nas mensagens do agente.
// Centraliza o estilo em um único lugar para manter consistência entre os
// diferentes chats (público, logado e turmas) e garantir um ritmo visual
// compacto e agradável, sem os grandes espaçamentos do white-space: pre-wrap.
export const markdownClasses = [
  'text-sm leading-relaxed break-words',
  // Parágrafos
  '[&_p]:mt-0 [&_p]:mb-2 [&_p:last-child]:mb-0',
  // Títulos compactos
  '[&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold',
  '[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold',
  '[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold',
  // Listas
  '[&_ul]:mt-0 [&_ul]:mb-2 [&_ul:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_ol]:mt-0 [&_ol]:mb-2 [&_ol:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li]:mb-1 [&_li:last-child]:mb-0 [&_li>p]:mb-0',
  // Código
  '[&_pre]:my-2 [&_pre:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre [&_pre]:rounded-md [&_pre]:bg-slate-900/90 [&_pre]:p-3 [&_pre]:text-slate-100',
  '[&_code]:rounded [&_code]:bg-black/10 dark:[&_code]:bg-white/15 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em]',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit',
  // Citações
  '[&_blockquote]:mt-0 [&_blockquote]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-300',
  // Tabelas
  '[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse',
  '[&_th]:border [&_th]:border-slate-300 [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold [&_th]:text-left',
  '[&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1',
  // Links e divisores
  '[&_a]:font-medium [&_a]:underline',
  '[&_hr]:my-3 [&_hr]:border-slate-300 dark:[&_hr]:border-slate-700',
].join(' ');

type MarkdownContentProps = {
  content: string;
  className?: string;
  suffix?: ReactNode;
};

export default function MarkdownContent({ content, className, suffix }: MarkdownContentProps) {
  return (
    <div className={`${markdownClasses}${className ? ` ${className}` : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
      {suffix}
    </div>
  );
}
