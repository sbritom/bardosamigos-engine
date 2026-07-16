import { Card } from '../../../../design-system'

export function DashboardCard({ title, eyebrow, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <Card className={`group rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[linear-gradient(180deg,var(--bds-color-surface),var(--bds-color-background))] p-4 shadow-[var(--bds-shadow-level-1)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--bds-color-primary-hover)] hover:shadow-[var(--bds-shadow-hover)] ${className}`}>
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--bds-color-border)] pb-3">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bds-color-surface)] text-[var(--bds-color-primary-hover)] ring-1 ring-[var(--bds-color-border)]">
                <Icon size={20} />
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && <div className="text-[11px] font-black uppercase tracking-wide text-[var(--bds-color-primary-hover)]">{eyebrow}</div>}
              {title && <h2 className="text-lg font-black leading-tight">{title}</h2>}
              {subtitle && <p className="mt-1 text-sm font-semibold text-[var(--bds-color-text-secondary)]">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  )
}
