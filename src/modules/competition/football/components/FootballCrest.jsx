import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { classNames } from '../../../../design-system'

function normalizeCrestUrl(value) {
  const source = typeof value === 'string' ? value.trim() : ''
  if (!source) return ''
  if (source.startsWith('//')) return `https:${source}`
  if (source.startsWith('http://')) return source.replace(/^http:\/\//i, 'https://')
  if (/^(https:\/\/|data:image\/|blob:|\/)/i.test(source)) return source
  return ''
}

export function FootballCrest({ src, name = '', className, iconSize = 18, loading = 'lazy' }) {
  const normalizedSrc = normalizeCrestUrl(src)
  const [failedSrc, setFailedSrc] = useState('')

  useEffect(() => {
    setFailedSrc('')
  }, [normalizedSrc])

  if (!normalizedSrc || failedSrc === normalizedSrc) {
    return (
      <span className={classNames('flex h-full w-full items-center justify-center text-[var(--bds-color-text-muted)]', className)} aria-hidden="true">
        <Shield size={iconSize} />
      </span>
    )
  }

  return (
    <img
      src={normalizedSrc}
      alt={name ? `Escudo de ${name}` : ''}
      className={classNames('block h-full w-full object-contain object-center', className)}
      loading={loading}
      onError={() => setFailedSrc(normalizedSrc)}
    />
  )
}
