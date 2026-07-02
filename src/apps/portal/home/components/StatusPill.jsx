export function StatusPill({ children, tone = 'gold' }) {
  const tones = {
    gold: 'border-[#4a3b16] bg-[#171106] text-[var(--gold)]',
    live: 'border-[#6b1515] bg-[#260606] text-[#ff6b6b] shadow-[0_0_24px_rgba(220,38,38,.18)]',
    muted: 'border-[var(--border)] bg-black text-[var(--secondary)]',
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  )
}
