import { useEffect, useState } from 'react'

export function ManagedTVIframe({
  src,
  title,
  allow,
  sandbox,
  referrerPolicy,
}) {
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    setLoading(true)
    setSlow(false)

    const timer = window.setTimeout(() => {
      setSlow(true)
    }, 9000)

    return () => window.clearTimeout(timer)
  }, [reloadKey, src])

  return (
    <div className="relative h-full w-full overflow-hidden bg-black" aria-busy={loading}>
      <iframe
        key={`${src}-${reloadKey}`}
        src={src}
        title={title}
        allow={allow}
        allowFullScreen
        loading="eager"
        referrerPolicy={referrerPolicy}
        sandbox={sandbox}
        className="h-full w-full border-0"
        onLoad={() => {
          setLoading(false)
          setSlow(false)
        }}
      />

      {loading ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/90 px-6 text-center text-white/80">
          <div className="grid max-w-sm gap-2">
            <strong className="text-sm text-white">Carregando canal…</strong>
            <small className="text-xs leading-relaxed text-white/55">
              {slow
                ? 'A fonte está demorando para responder. Você pode tentar recarregar o canal.'
                : 'Aguarde enquanto a transmissão é iniciada.'}
            </small>
            {slow ? (
              <button
                type="button"
                className="mx-auto mt-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-500/20"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
