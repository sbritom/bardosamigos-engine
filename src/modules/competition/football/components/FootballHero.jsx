import { Activity, CalendarDays, CheckCircle2, Clock3, Radio, Trophy } from 'lucide-react'
import { formatBrazilDate, getRelativeBrazilDayLabel } from '../../../../core/time'
import { FootballEmptyState, FootballStatusBadge } from './FootballCommon'
import { formatFootballScore, getFootballMatchTime, getFootballStageLabel } from '../utils/footballCenterUtils'

function FootballHeroTeam({ name, crest, align = 'left', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Abrir pagina de ${name || 'time'}`}
      className={`group flex min-w-0 items-center gap-[var(--bds-space-10)] rounded-[var(--bds-radius-sm)] text-left transition duration-[var(--bds-transition-fast)] hover:text-[var(--bds-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center drop-shadow-sm transition duration-[var(--bds-transition-fast)] group-hover:scale-[1.04] sm:h-16 sm:w-16">
        {crest ? <img src={crest} alt="" className="h-full w-full object-contain" /> : <Trophy size={28} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
      </span>
      <strong className="truncate text-base font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)] sm:text-lg">
        {name || 'Time a definir'}
      </strong>
    </button>
  )
}

function HeroMetric({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-center gap-[var(--bds-space-8)] border-l border-[color-mix(in_srgb,var(--bds-color-border)_64%,transparent)] pl-[var(--bds-space-10)] first:border-l-0 first:pl-0">
      <Icon size={15} className="shrink-0 text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
      <span className="min-w-0">
        <strong className="block truncate text-sm font-black tabular-nums text-[var(--bds-color-text)]">{value}</strong>
        <span className="block truncate text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">{label}</span>
      </span>
    </div>
  )
}

export function FootballHero({ match, stats, onOpen, onTeam }) {
  if (!match) {
    return (
      <section className="border-y border-[color-mix(in_srgb,var(--bds-color-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_28%,transparent)] px-[var(--bds-space-16)] py-[var(--bds-space-18)]">
        <FootballEmptyState compact title="Central pronta para a proxima rodada" description="Assim que houver uma partida sincronizada, o destaque sera atualizado aqui." />
      </section>
    )
  }

  const stageLabel = getFootballStageLabel(match.stage)
  const roundLabel = match.round?.name || stageLabel || 'Rodada atual'
  const dateLabel = match.startsAt ? `${getRelativeBrazilDayLabel(match.startsAt)} - ${formatBrazilDate(match.startsAt)}` : 'Data a definir'

  return (
    <section className="relative overflow-hidden rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_72%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--bds-color-surface)_72%,transparent),color-mix(in_srgb,var(--bds-color-background)_88%,transparent))] shadow-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0,color-mix(in_srgb,var(--bds-color-primary)_24%,transparent),transparent_48%)] opacity-[var(--bds-opacity-subtle)]" aria-hidden="true" />

      <div className="relative grid gap-[var(--bds-space-14)] px-[var(--bds-space-16)] py-[var(--bds-space-16)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--bds-space-10)]">
          <div className="min-w-0">
            <p className="truncate text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-primary-hover)]">
              {match.competitionName || 'Central do Futebol'}
            </p>
            <h1 className="mt-[var(--bds-space-3)] truncate text-lg font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)] sm:text-xl">
              {roundLabel}
            </h1>
          </div>
          <FootballStatusBadge match={match} />
        </div>

        <div className="grid w-full items-center gap-[var(--bds-space-12)] text-left md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <FootballHeroTeam name={match.homeTeam} crest={match.homeCrest} onClick={() => onTeam(match.homeTeam)} />
          <button
            type="button"
            onClick={() => onOpen(match.id)}
            className="mx-auto flex min-w-28 flex-col items-center justify-center rounded-[var(--bds-radius-sm)] border border-[color-mix(in_srgb,var(--bds-color-border)_76%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_54%,transparent)] px-[var(--bds-space-16)] py-[var(--bds-space-8)] transition duration-[var(--bds-transition-fast)] hover:border-[var(--bds-color-primary-hover)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_16%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
          >
            <strong className="text-3xl font-black tabular-nums leading-none text-[var(--bds-color-text)] sm:text-4xl">{formatFootballScore(match)}</strong>
            <span className="mt-[var(--bds-space-4)] text-xs font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-primary-hover)]">{getFootballMatchTime(match)}</span>
          </button>
          <FootballHeroTeam name={match.awayTeam} crest={match.awayCrest} align="right" onClick={() => onTeam(match.awayTeam)} />
        </div>

        <div className="grid gap-[var(--bds-space-10)] border-t border-[color-mix(in_srgb,var(--bds-color-border)_64%,transparent)] pt-[var(--bds-space-12)] sm:grid-cols-2 xl:grid-cols-5">
          <HeroMetric icon={CalendarDays} label="Data" value={dateLabel} />
          <HeroMetric icon={Activity} label="Jogos" value={stats?.total ?? 0} />
          <HeroMetric icon={Radio} label="Ao vivo" value={stats?.live ?? 0} />
          <HeroMetric icon={Clock3} label="Proximas" value={stats?.upcoming ?? 0} />
          <HeroMetric icon={CheckCircle2} label="Finalizadas" value={stats?.finished ?? 0} />
        </div>
      </div>
    </section>
  )
}

export function FootballSummaryCards({ stats, onSelect, cards: customCards }) {
  const cards = customCards || [
    { id: 'all', label: 'Monitorados', value: stats.total, icon: Activity },
    { id: 'live', label: 'Ao vivo', value: stats.live, icon: Radio },
    { id: 'today', label: 'Hoje', value: stats.today, icon: CalendarDays },
    { id: 'finished', label: 'Finalizados', value: stats.finished, icon: CheckCircle2 },
    { id: 'week', label: 'Proximos', value: stats.upcoming, icon: Clock3 },
    { id: 'all', label: 'Competicoes', value: stats.competitions, icon: Trophy },
  ]

  return (
    <div className="grid overflow-hidden rounded-[var(--bds-radius-sm)] border-y border-[color-mix(in_srgb,var(--bds-color-border)_68%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_24%,transparent)] sm:grid-cols-2 lg:grid-cols-6">
      {cards.map(({ id, label, value, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(id)}
          className="flex min-h-12 items-center justify-center gap-[var(--bds-space-8)] border-b border-r border-[color-mix(in_srgb,var(--bds-color-border)_52%,transparent)] px-[var(--bds-space-8)] py-[var(--bds-space-7)] text-center transition duration-[var(--bds-transition-fast)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_14%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
        >
          <Icon size={14} className="shrink-0 text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
          <strong className="text-xl font-black tabular-nums leading-none text-[var(--bds-color-text)]">{value}</strong>
          <span className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-secondary)]">{label}</span>
        </button>
      ))}
    </div>
  )
}
