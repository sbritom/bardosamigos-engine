import { useEffect, useRef, useState } from 'react'

const NATIVE_HLS_TYPE = 'application/vnd.apple.mpegurl'

export function OfficialHlsPlayer({ src, title = 'Canal ao vivo' }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return undefined

    let cancelled = false
    let hls = null
    setError('')

    const cleanupVideo = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    if (video.canPlayType(NATIVE_HLS_TYPE)) {
      video.src = src
      return cleanupVideo
    }

    import('hls.js/light')
      .then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls?.isSupported?.()) {
          setError('Este navegador nao oferece suporte a esta transmissao HLS.')
          return
        }

        hls = new Hls({
          enableWorker: false,
          lowLatencyMode: false,
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data?.fatal) return
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad()
            return
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
            return
          }
          setError('A fonte deste canal nao respondeu corretamente.')
          hls.destroy()
          hls = null
        })
        hls.loadSource(src)
        hls.attachMedia(video)
      })
      .catch(() => {
        if (!cancelled) setError('Nao foi possivel iniciar o player HLS.')
      })

    return () => {
      cancelled = true
      hls?.destroy()
      cleanupVideo()
    }
  }, [src])

  if (error) {
    return (
      <div className="grid h-full w-full place-items-center bg-black px-6 text-center text-sm font-semibold text-white/75" role="status">
        {error}
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      className="h-full w-full bg-black object-contain"
    />
  )
}
