export function TeamShield({ label, src, className = '', imageClassName = '' }) {
  const wrapperClassName = [
    'mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] text-lg font-black text-[var(--bds-color-primary-hover)] shadow-[var(--bds-shadow-level-1)]',
    className,
  ].filter(Boolean).join(' ')
  const crestClassName = imageClassName || 'h-12 w-12 object-contain'

  return (
    <div className={wrapperClassName}>
      {src ? <img src={src} alt="" className={crestClassName} loading="lazy" /> : label}
    </div>
  )
}
