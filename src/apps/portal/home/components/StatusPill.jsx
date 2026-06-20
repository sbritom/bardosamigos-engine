export function StatusPill({ children, tone = 'gold' }) {
  const tones = {
    gold: 'border-[var(--gold)] text-[var(--gold)]',
    live: 'border-[var(--success)] text-[var(--success)]',
    muted: 'border-[var(--border)] text-[var(--secondary)]',
  }

  return (
    <span className={`rounded-full border bg-black px-3 py-1 text-xs font-black uppercase ${tones[tone]}`}>
      {children}
    </span>
  )
}
