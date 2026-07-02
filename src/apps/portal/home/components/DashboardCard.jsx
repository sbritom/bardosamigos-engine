import { Card } from '../../../../design-system'

export function DashboardCard({ title, eyebrow, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <Card className={`group rounded-[var(--radius)] border border-[#242014] bg-[linear-gradient(180deg,#101010,#090909)] p-4 shadow-[0_18px_55px_rgba(0,0,0,.38)] transition duration-200 hover:-translate-y-0.5 hover:border-[#3f3417] hover:shadow-[0_22px_70px_rgba(0,0,0,.48)] ${className}`}>
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#1f1b10] pb-3">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#151108] text-[var(--gold)] ring-1 ring-[#30250d]">
                <Icon size={20} />
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && <div className="text-[11px] font-black uppercase tracking-wide text-[var(--gold)]">{eyebrow}</div>}
              {title && <h2 className="text-lg font-black leading-tight">{title}</h2>}
              {subtitle && <p className="mt-1 text-sm font-semibold text-[var(--secondary)]">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  )
}
