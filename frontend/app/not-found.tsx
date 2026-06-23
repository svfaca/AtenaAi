import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-md w-full text-center text-white">
        <div className="mb-6">
          <div className="text-6xl font-bold mb-4">404</div>
          <h1 className="text-3xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-slate-300">
            A página que você procura não existe ou foi movida.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
