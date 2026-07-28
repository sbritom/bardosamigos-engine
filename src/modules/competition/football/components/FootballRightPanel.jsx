import { useMemo, useState } from 'react'
import { BarChart3, ListOrdered, Shield } from 'lucide-react'
import { Button, EmptyState } from '../../../../design-system'
import { calculateStandings } from '../../services/footballCenterService'
import { FOOTBALL_COMPETITION_NAV } from '../constants/footballCenterConstants'
import { footballMatchBelongsToCompetition } from '../utils/footballCenterUtils'

const BRASILEIRAO_NAV_ITEM = FOOTBALL_COMPETITION_NAV.find((item) => item.id === 'BSA')

function MiniTeamMark({ crest }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center drop-shadow-sm">
      {crest ? <img src={crest} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Shield size={12} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
    </span>
  )
}

function FootballRightBlock({ title, eyebrow, icon: Icon, children }) {
  return (
    <section className="border-t border-[color-mix(in_srgb,var(--bds-color-border)_54%,transparent)] pt-[var(--bds-space-10)]">
      <div className="mb-[var(--bds-space-7)] flex items-center gap-[var(--bds-space-7)]">
        <Icon size={14} className="shrink-0 text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
        <div className="min-w-0">
          {eyebrow ? <p className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">{eyebrow}</p> : null}
          <h2 className="truncate text-lg font-black text-[var(--bds-color-text)]">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

function BrasileiraoStandingsPanel({ matches }) {
  const [expanded, setExpanded] = useState(false)
  const rows = useMemo(() => {
    if (!BRASILEIRAO_NAV_ITEM) return []
    return calculateStandings(matches.filter((match) => footballMatchBelongsToCompetition(match, BRASILEIRAO_NAV_ITEM)))
  }, [matches])
  const visibleRows = expanded ? rows : rows.slice(0, 8)

  return (
    <FootballRightBlock title="Classificacao" eyebrow="Brasileirao Serie A" icon={ListOrdered}>
      {rows.length ? (
        <>
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--bds-font-micro)] uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">
              <tr>
                <th scope="col" className="pb-[var(--bds-space-7)]">#</th>
                <th scope="col" className="pb-[var(--bds-space-7)]">Time</th>
                <th scope="col" className="pb-[var(--bds-space-7)] text-right">Pts</th>
                <th scope="col" className="pb-[var(--bds-space-7)] text-right">J</th>
                <th scope="col" className="hidden pb-[var(--bds-space-7)] text-right sm:table-cell">V</th>
                <th scope="col" className="hidden pb-[var(--bds-space-7)] text-right sm:table-cell">E</th>
                <th scope="col" className="hidden pb-[var(--bds-space-7)] text-right sm:table-cell">D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color-mix(in_srgb,var(--bds-color-border)_50%,transparent)]">
              {visibleRows.map((row) => (
                <tr key={row.name} className="text-[var(--bds-color-text-secondary)]">
                  <td className="py-[var(--bds-space-5)] font-black tabular-nums text-[var(--bds-color-primary-hover)]">{row.position}</td>
                  <td className="min-w-0 py-[var(--bds-space-5)]">
                    <div className="flex min-w-0 items-center gap-[var(--bds-space-6)]">
                      <MiniTeamMark crest={row.crest} />
                      <span className="truncate font-black text-[var(--bds-color-text)]">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-[var(--bds-space-5)] text-right font-black tabular-nums text-[var(--bds-color-text)]">{row.points}</td>
                  <td className="py-[var(--bds-space-5)] text-right tabular-nums">{row.played}</td>
                  <td className="hidden py-[var(--bds-space-5)] text-right tabular-nums sm:table-cell">{row.wins}</td>
                  <td className="hidden py-[var(--bds-space-5)] text-right tabular-nums sm:table-cell">{row.draws}</td>
                  <td className="hidden py-[var(--bds-space-5)] text-right tabular-nums sm:table-cell">{row.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 8 ? <Button variant="secondary" className="mt-[var(--bds-space-10)] w-full justify-center" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Ver top 8' : 'Ver completa'}</Button> : null}
        </>
      ) : (
        <EmptyState title="Classificacao indisponivel" />
      )}
    </FootballRightBlock>
  )
}

function CompactStats({ items }) {
  return (
    <div className="grid gap-[var(--bds-space-8)] sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[var(--bds-radius-sm)] border border-[color-mix(in_srgb,var(--bds-color-border)_42%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_14%,transparent)] px-[var(--bds-space-10)] py-[var(--bds-space-8)] shadow-none">
          <span className="block text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">{item.label}</span>
          <strong className="mt-[var(--bds-space-4)] block text-sm font-black text-[var(--bds-color-text)]">{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export function FootballRightPanel({ data, statCards }) {
  const matches = data.matches || []
  const stats = statCards || [
    { label: 'Artilheiros', value: '-' },
    { label: 'Assistencias', value: '-' },
    { label: 'Cartoes', value: '-' },
  ]

  return (
    <section className="space-y-[var(--bds-space-12)]" aria-label="Classificacao e estatisticas">
      <BrasileiraoStandingsPanel matches={matches} />
      <FootballRightBlock title="Estatisticas" icon={BarChart3}>
        <CompactStats items={stats} />
      </FootballRightBlock>
    </section>
  )
}
