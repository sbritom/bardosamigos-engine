import { NavLink } from 'react-router-dom'

const items = [
  ['Campeonatos', '/admin/competition/campeonatos'],
  ['Temporadas', '/admin/competition/temporadas'],
  ['Rodadas', '/admin/competition/rodadas'],
  ['Times', '/admin/competition/times'],
  ['Jogos', '/admin/competition/jogos'],
  ['Resultados', '/admin/competition/resultados'],
]

export function CompetitionAdminNav() {
  return (
    <nav className="mb-5 flex flex-wrap gap-2">
      {items.map(([label, path]) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `rounded-lg border px-3 py-2 text-sm font-bold ${
              isActive
                ? 'border-[var(--bds-color-primary-hover)] bg-[var(--bds-color-primary)] text-[var(--bds-color-text)]'
                : 'border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] text-[var(--bds-color-text)] hover:text-[var(--bds-color-primary-hover)]'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
