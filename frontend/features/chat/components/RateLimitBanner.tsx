'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type RateLimitBannerProps = {
  resetInSeconds: number;
  message?: string;
  onExpire?: () => void;
};

export default function RateLimitBanner({ resetInSeconds, message, onExpire }: RateLimitBannerProps) {
  const [seconds, setSeconds] = useState(resetInSeconds);

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
  }, []);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const format = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
      <p className="font-semibold text-yellow-800">⚠️ Limite diário de mensagens atingido</p>

      <p className="mt-1 text-sm text-yellow-700">
        {message || 'Você atingiu o limite de mensagens para usuários visitantes.'}
      </p>

      <div className="mt-3 font-mono text-lg text-yellow-900">
        {format(hours)}:{format(minutes)}:{format(secs)}
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Criar conta grátis
        </Link>

        <Link
          href="/login"
          className="rounded-lg border border-yellow-600 px-4 py-2 text-sm font-medium text-yellow-800 transition hover:bg-yellow-100"
        >
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
