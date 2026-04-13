import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase">
            Grupo Lorinvest
          </span>
          <h1 className="mt-2 text-4xl font-bold text-brand-900">
            Newsletter Platform
          </h1>
          <p className="mt-4 text-gray-600">
            Monitore palavras-chave, agregue noticias e envie newsletters
            automatizadas para seus assinantes.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Acessar Dashboard
        </Link>
      </div>
    </main>
  );
}
