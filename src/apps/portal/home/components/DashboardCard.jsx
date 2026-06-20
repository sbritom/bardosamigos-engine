import { Card } from '../../../../design-system'

export function DashboardCard({ title, eyebrow, action, children, className = '' }) {
  return (
    <Card className={`rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl ${className}`}>
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <div className="text-xs font-black uppercase text-[var(--gold)]">{eyebrow}</div>}
            {title && <h2 className="text-xl font-black">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  )
}
