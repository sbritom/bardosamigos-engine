import { CompetitionAdminNav } from '../components/CompetitionAdminNav'
import { IntegrationsPanel } from '../components/IntegrationsPanel'

export function CompetitionAdminLayout({ children }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--bds-color-text-secondary)]">Admin</p>
        <h1 className="mt-1 text-2xl font-black text-[var(--bds-color-primary-hover)]">Bar Competition</h1>
        <p className="mt-2 text-[var(--bds-color-text-secondary)]">
          Painel administrativo para campeonatos, temporadas, rodadas, times e jogos.
        </p>
      </div>
      <IntegrationsPanel />
      <CompetitionAdminNav />
      {children}
    </div>
  )
}
