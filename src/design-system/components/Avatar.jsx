import { classNames } from '../utils'

export function Avatar({ src, alt = '', fallback = '?', size = 'md', className }) {
  return (
    <span className={classNames('bds-avatar', `bds-avatar--${size}`, className)}>
      {src ? <img src={src} alt={alt} /> : <span aria-hidden="true">{fallback}</span>}
    </span>
  )
}
