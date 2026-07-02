export function TeamShield({ label, src, className = '', imageClassName = '' }) {
  const wrapperClassName = [
    'mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius)] border border-[var(--gold)] bg-black text-lg font-black text-[var(--gold)] shadow-lg',
    className,
  ].filter(Boolean).join(' ')
  const crestClassName = imageClassName || 'h-12 w-12 object-contain'

  return (
    <div className={wrapperClassName}>
      {src ? <img src={src} alt="" className={crestClassName} loading="lazy" /> : label}
    </div>
  )
}
