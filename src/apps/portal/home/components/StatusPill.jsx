export function StatusPill({ children, tone = 'gold' }) {
  const tones = {
    gold: 'border-[var(--bds-color-border)] bg-[var(--bds-color-primary)] text-[var(--bds-color-text)]',
    live: 'border-[var(--bds-color-danger)] bg-[var(--bds-color-danger)] text-[var(--bds-color-text)] shadow-[0_0_24px_var(--bds-color-glow)]',
    muted: 'border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] text-[var(--bds-color-text-secondary)]',
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  )
}
