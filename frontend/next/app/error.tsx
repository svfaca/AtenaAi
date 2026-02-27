'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-md w-full text-center text-white">
        <div className="mb-6">
          <div className="text-5xl font-bold mb-4">⚠️</div>
          <h1 className="text-3xl font-bold mb-2">Algo deu errado!</h1>
          <p className="text-slate-300">
            Desculpe, encontramos um erro ao processar sua requisição.
          </p>
        </div>

        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-red-200 font-mono">
            {error.message || 'Erro desconhecido'}
          </p>
        </div>

        <Button onClick={() => reset()} className="w-full">
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
