import React from 'react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[portal] erro nao tratado na interface', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10 text-[var(--text)]">
        <section
          className="w-full max-w-xl rounded-3xl border border-white/10 bg-[var(--surface)] p-6 text-center shadow-xl md:p-8"
          role="alert"
          aria-labelledby="portal-error-title"
        >
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Bar dos Amigos
          </span>
          <h1 id="portal-error-title" className="mt-2 text-2xl font-black">
            Nao foi possivel carregar esta parte do portal
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            O restante do site continua seguro. Atualize a pagina para tentar carregar novamente ou volte para a pagina inicial.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-bold transition hover:bg-white/10"
            >
              Voltar ao inicio
            </a>
          </div>
        </section>
      </main>
    )
  }
}
