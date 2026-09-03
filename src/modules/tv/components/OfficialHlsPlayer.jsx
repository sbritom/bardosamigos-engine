import { useEffect, useRef, useState } from 'react'

const NATIVE_HLS_TYPE = 'application/vnd.apple.mpegurl'
const PLAYER_READY_TIMEOUT_MS = 18000
const MAX_NETWORK_RETRIES = 2
const MAX_MEDIA_RETRIES = 1

export function OfficialHlsPlayer({ src, title = 'Canal ao vivo' }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return undefined

    let cancelled = false
    let hls = null
    let readyTimer = null
    let networkRetries = 0
    let mediaRetries = 0

    setError('')
    setLoading(true)

    const cleanupVideo = () => {
      window.clearTimeout(readyTimer)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    const markReady = () => {
      if (cancelled) return
      window.clearTimeout(readyTimer)
      setLoading(false)
      setError('')
    }

    const fail = (message) => {
      if (cancelled) return
      window.clearTimeout(readyTimer)
      setLoading(false)
      setError(message)
      video.pause()
    }

    video.addEventListener('canplay', markReady)
    video.addEventListener('playing', markReady)

    readyTimer = window.setTimeout(() => {
      fail('A transmissão está demorando para responder.')
    }, PLAYER_READY_TIMEOUT_MS)

    if (video.canPlayType(NATIVE_HLS_TYPE)) {
      const handleNativeError = () => {
        fail('A fonte deste canal não respondeu corretamente.')
      }
      video.addEventListener('error', handleNativeError)
      video.src = src
      video.load()

      return () => {
        cancelled = true
        video.removeEventListener('canplay', markReady)
        video.removeEventListener('playing', markReady)
        video.removeEventListener('error', handleNativeError)
        cleanupVideo()
      }
    }

    import('hls.js/light')
      .then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls?.isSupported?.()) {
          fail('Este navegador não oferece suporte a esta transmissão HLS.')
          return
        }

        hls = new Hls({
          enableWorker: false,
          lowLatencyMode: false,
        })

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data?.fatal || cancelled) return

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < MAX_NETWORK_RETRIES) {
            networkRetries += 1
            window.setTimeout(() => {
              if (!cancelled && hls) hls.startLoad()
            }, 600 * networkRetries)
            return
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < MAX_MEDIA_RETRIES) {
            mediaRetries += 1
            hls.recoverMediaError()
            return
          }

          fail('A fonte deste canal não respondeu corretamente.')
          hls.destroy()
          hls = null
        })

        hls.loadSource(src)
        hls.attachMedia(video)
      })
      .catch(() => {
        fail('Não foi possível iniciar o player HLS.')
      })

    return () => {
      cancelled = true
      video.removeEventListener('canplay', markReady)
      video.removeEventListener('playing', markReady)
      window.clearTimeout(readyTimer)
      hls?.destroy()
      cleanupVideo()
    }
  }, [retryToken, src])

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
        className="h-full w-full bg-black object-contain"
      />

      {loading && !error ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/70 px-6 text-center text-sm font-semibold text-white/70">
          Iniciando transmissão…
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-black/90 px-6 text-center text-white/75" role="status">
          <div className="grid max-w-sm gap-3">
            <strong className="text-sm text-white">Canal temporariamente indisponível</strong>
            <span className="text-xs leading-relaxed text-white/60">{error}</span>
            <button
              type="button"
              className="mx-auto rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-500/20"
              onClick={() => setRetryToken((current) => current + 1)}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
