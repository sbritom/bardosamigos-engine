import { Home, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:py-16" aria-labelledby="not-found-title">
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 text-center shadow-xl md:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
          <SearchX size={28} aria-hidden="true" />
        </span>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">Erro 404</p>
        <h1 id="not-found-title" className="mt-2 text-3xl font-black text-[var(--text)]">
          Pagina nao encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          Este endereco nao existe ou foi movido. Voce pode voltar para a pagina inicial e continuar navegando normalmente.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110"
        >
          <Home size={18} aria-hidden="true" />
          Ir para a pagina inicial
        </Link>
      </section>
    </main>
  )
}
