import { CompetitionAdminNav } from '../components/CompetitionAdminNav'
import { IntegrationsPanel } from '../components/IntegrationsPanel'

export function CompetitionAdminLayout({ children }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--secondary)]">Admin</p>
        <h1 className="mt-1 text-2xl font-black text-[var(--gold)]">Bar Competition</h1>
        <p className="mt-2 text-[var(--secondary)]">
          Painel administrativo para campeonatos, temporadas, rodadas, times e jogos.
        </p>
      </div>
      <IntegrationsPanel />
      <CompetitionAdminNav />
      {children}
    </div>
  )
}
