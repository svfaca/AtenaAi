'use client';

import { useEffect, useState } from 'react';

type AtenaLimitMessageProps = {
  resetInSeconds: number;
  onLogin: () => void;
  onRegister: () => void;
  onExpire?: () => void;
};

export default function AtenaLimitMessage({
  resetInSeconds,
  onLogin,
  onRegister,
  onExpire,
}: AtenaLimitMessageProps) {
  const [seconds, setSeconds] = useState(resetInSeconds);

  useEffect(() => {
    setSeconds(resetInSeconds);
  }, [resetInSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const format = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="max-w-[90%] rounded-2xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">AtenaAI</p>

      <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
        Voce atingiu o limite diario de mensagens para visitantes.
      </p>

      <p className="mb-4 font-mono text-lg text-slate-900 dark:text-slate-100">
        {format(h)}:{format(m)}:{format(s)}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRegister}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          type="button"
        >
          Criar conta gratis
        </button>

        <button
          onClick={onLogin}
          className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-200 dark:border-slate-500 dark:text-slate-100 dark:hover:bg-slate-700"
          type="button"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
