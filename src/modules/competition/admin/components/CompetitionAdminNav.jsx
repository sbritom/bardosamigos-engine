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
                ? 'border-[var(--gold)] bg-[var(--gold)] text-black'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:text-[var(--gold)]'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
