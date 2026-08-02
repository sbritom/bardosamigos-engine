import { CalendarDays, CheckCircle2, Clock3, Radio } from 'lucide-react'
import { isLiveStatus } from '../../../../core/time'
import { FootballEmptyState, FootballStatusBadge } from './FootballCommon'
import { FootballLiveValue } from './FootballLiveMotion'
import { FootballCrest } from './FootballCrest'
import { formatFootballScore, getFootballMatchDisplayStatus, getFootballMatchMinute, getFootballMatchTime, getFootballStageLabel } from '../utils/footballCenterUtils'

function getCompetitionDisplayName(value) {
  return String(value || '').replace(/\s*-\s*sincroniza(?:c|ç)(?:a|ã)o\b.*$/i, '').trim()
}

function FootballHeroTeam({ name, crest, align = 'left', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Abrir pagina de ${name || 'time'}`}
      className={`group flex min-w-0 items-center gap-[var(--bds-space-10)] rounded-[var(--bds-radius-sm)] text-left transition hover:text-[var(--bds-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center transition sm:h-14 sm:w-14">
        <FootballCrest src={crest} name={name} iconSize={28} loading="eager" />
      </span>
      <strong className="truncate text-base font-bold text-[var(--bds-color-text)] sm:text-lg">
        {name || 'Time a definir'}
      </strong>
    </button>
  )
}

export function FootballHero({ match, onOpen, onTeam }) {
  if (!match) {
    return (
      <section className="border-y border-[color-mix(in_srgb,var(--bds-color-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_28%,transparent)] px-[var(--bds-space-16)] py-[var(--bds-space-12)]">
        <FootballEmptyState compact title="Nenhuma partida em destaque" />
      </section>
    )
  }

  const display = getFootballMatchDisplayStatus(match)
  const live = isLiveStatus(display.value) || isLiveStatus(match?.status)
  const timeLabel = live ? getFootballMatchMinute(match) : getFootballMatchTime(match) || 'Horario a definir'
  const scoreLabel = formatFootballScore(match)
  const roundLabel = match.round?.name || getFootballStageLabel(match.stage) || ''
  const competitionLabel = getCompetitionDisplayName(match.competitionName)

  return (
    <section key={match.id} className="bds-football-hero-motion relative grid min-h-[136px] overflow-hidden rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_34%,transparent)] shadow-none sm:min-h-[148px]">
      <div className="grid content-center gap-[var(--bds-space-10)] px-[var(--bds-space-16)] py-[var(--bds-space-10)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--bds-space-8)]">
          <p className="truncate text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-primary-hover)]">
            {[competitionLabel, roundLabel].filter(Boolean).join(' - ') || 'Central do Futebol'}
          </p>
          <div className="flex items-center gap-[var(--bds-space-8)]">
            <FootballStatusBadge match={match} />
            {timeLabel ? (
              <FootballLiveValue as="span" value={timeLabel} className={`bds-football-time-value text-xs font-black tabular-nums ${live ? 'bds-football-minute-value text-[var(--bds-color-danger)]' : 'text-[var(--bds-color-text-secondary)]'}`}>
                {timeLabel}
              </FootballLiveValue>
            ) : null}
          </div>
        </div>

        <div className="grid w-full items-center gap-[var(--bds-space-12)] text-left md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <FootballHeroTeam name={match.homeTeam} crest={match.homeCrest} onClick={() => onTeam(match.homeTeam)} />
          <button
            type="button"
            onClick={() => onOpen(match.id)}
            className="mx-auto flex min-w-28 flex-col items-center justify-center rounded-[var(--bds-radius-sm)] border border-[color-mix(in_srgb,var(--bds-color-border)_62%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_46%,transparent)] px-[var(--bds-space-14)] py-[var(--bds-space-8)] transition hover:border-[color-mix(in_srgb,var(--bds-color-primary-hover)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
          >
            <FootballLiveValue
              as="strong"
              value={scoreLabel}
              highlight={match.hasScore}
              className="bds-football-score-value text-[2rem] font-black tabular-nums leading-none text-[var(--bds-color-text)] sm:text-[2.45rem]"
            >
              {scoreLabel}
            </FootballLiveValue>
          </button>
          <FootballHeroTeam name={match.awayTeam} crest={match.awayCrest} align="right" onClick={() => onTeam(match.awayTeam)} />
        </div>
      </div>
    </section>
  )
}

export function FootballSummaryCards({ stats, onSelect, cards: customCards }) {
  const cards = customCards || [
    { id: 'live', label: 'Ao vivo', value: stats.live, icon: Radio },
    { id: 'today', label: 'Hoje', value: stats.today, icon: CalendarDays },
    { id: 'week', label: 'Proximos', value: stats.upcoming, icon: Clock3 },
    { id: 'finished', label: 'Finalizados', value: stats.finished, icon: CheckCircle2 },
  ]

  return (
    <div className="grid gap-[var(--bds-space-5)] border-y border-[color-mix(in_srgb,var(--bds-color-border)_52%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_12%,transparent)] px-[var(--bds-space-8)] py-[var(--bds-space-6)] sm:grid-cols-4">
      {cards.map(({ id, label, value, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(id)}
          className="grid min-h-12 place-items-center rounded-[var(--bds-radius-xs)] px-[var(--bds-space-8)] py-[var(--bds-space-4)] text-center text-xs font-bold text-[var(--bds-color-text-secondary)] transition hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_8%,transparent)] hover:text-[var(--bds-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
        >
          <span className="flex items-center gap-[var(--bds-space-5)] text-[var(--bds-font-micro)] uppercase tracking-[var(--bds-letter-overline)]">
            <Icon size={12} className="shrink-0 text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
            {label}
          </span>
          <strong className="text-lg tabular-nums text-[var(--bds-color-text)]">{value}</strong>
        </button>
      ))}
    </div>
  )
}
