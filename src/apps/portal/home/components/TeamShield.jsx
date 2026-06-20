export function TeamShield({ label }) {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius)] border border-[var(--gold)] bg-black text-lg font-black text-[var(--gold)] shadow-lg">
      {label}
    </div>
  )
}
