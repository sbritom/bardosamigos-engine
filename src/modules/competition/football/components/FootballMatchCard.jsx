import { memo } from 'react'
import { Shield, Star } from 'lucide-react'
import { isLiveStatus } from '../../../../core/time'
import { FootballStatusBadge } from './FootballCommon'
import { FootballLiveValue } from './FootballLiveMotion'
import { formatFootballScore, getFootballMatchDisplayStatus, getFootballMatchTime } from '../utils/footballCenterUtils'

function FootballMatchTeam({ name, crest, align = 'left' }) {
  return (
    <span className={`flex min-w-0 items-center gap-[var(--bds-space-8)] ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center drop-shadow-sm sm:h-10 sm:w-10">
        {crest ? <img src={crest} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Shield size={20} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
      </span>
      <span className="truncate text-base font-bold leading-tight text-[var(--bds-color-text)]">{name || 'Time'}</span>
    </span>
  )
}

function getMatchMinute(match) {
  const metadata = match?.metadata || {}
  const raw = metadata.raw || {}
  const explicitMinute = metadata.minute || metadata.elapsed || metadata.matchMinute || raw.minute || raw.elapsed
  const numericMinute = Number.parseInt(String(explicitMinute || '').replace(/\D/g, ''), 10)
  if (Number.isFinite(numericMinute) && numericMinute > 0) return `${numericMinute}'`

  if (!isLiveStatus(match?.status) || !match?.startsAt) return ''
  const elapsed = Math.floor((Date.now() - new Date(match.startsAt).getTime()) / 60000)
  if (!Number.isFinite(elapsed) || elapsed <= 0) return ''
  return `${Math.min(elapsed, 120)}'`
}

function getTimeLabel(match) {
  const display = getFootballMatchDisplayStatus(match)
  if (isLiveStatus(display.value) || isLiveStatus(match?.status)) return getMatchMinute(match)
  return getFootballMatchTime(match)
}

function getPlaceLabel(match) {
  return match?.venue || match?.stadium || ''
}

function getMatchRenderSignature(match) {
  const metadata = match?.metadata || {}
  const raw = metadata.raw || {}
  return [
    match?.id,
    match?.homeTeam,
    match?.awayTeam,
    match?.homeCrest,
    match?.awayCrest,
    match?.homeScore,
    match?.awayScore,
    match?.hasScore,
    match?.status,
    match?.standardStatus,
    match?.localTime,
    match?.startsAt,
    match?.venue,
    match?.stadium,
    match?.competitionName,
    metadata.providerStatus,
    metadata.minute,
    metadata.elapsed,
    metadata.matchMinute,
    raw.status,
    raw.minute,
    raw.elapsed,
  ].join('|')
}

export const FootballMatchCard = memo(function FootballMatchCard({ match, onOpen, favorited = false, onFavorite }) {
  const timeLabel = getTimeLabel(match)
  const placeLabel = getPlaceLabel(match)
  const scoreLabel = formatFootballScore(match)

  return (
    <article className={`bds-football-match-row group relative grid min-h-[4.5rem] border-b border-[color-mix(in_srgb,var(--bds-color-border)_46%,transparent)] bg-transparent transition hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_6%,transparent)] ${favorited ? 'shadow-[inset_2px_0_0_var(--bds-color-primary-hover)]' : ''}`}>
      {onFavorite ? (
        <button
          type="button"
          onClick={() => onFavorite(match)}
          aria-pressed={favorited}
          aria-label={favorited ? `Remover ${match.homeTeam} contra ${match.awayTeam} dos favoritos` : `Favoritar ${match.homeTeam} contra ${match.awayTeam}`}
          className={`absolute left-[var(--bds-space-7)] top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${favorited ? 'border-[var(--bds-color-primary-hover)] bg-[color-mix(in_srgb,var(--bds-color-primary)_24%,transparent)] text-[var(--bds-color-primary-hover)]' : 'border-transparent text-[var(--bds-color-text-muted)] hover:border-[var(--bds-color-border)] hover:text-[var(--bds-color-text)]'}`}
        >
          <Star size={13} fill={favorited ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onOpen(match.id)}
        aria-label={`Abrir ${match.homeTeam} contra ${match.awayTeam}`}
        className="grid w-full items-center gap-[var(--bds-space-8)] px-[var(--bds-space-10)] py-[var(--bds-space-7)] pl-[var(--bds-space-32)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] md:grid-cols-[minmax(0,1fr)_minmax(6rem,8rem)_minmax(0,1fr)_minmax(8rem,12rem)]"
      >
        <FootballMatchTeam name={match.homeTeam} crest={match.homeCrest} />

        <span className="flex flex-col items-center justify-center gap-[var(--bds-space-5)] text-center">
          <FootballLiveValue
            as="strong"
            value={scoreLabel}
            highlight={match.hasScore}
            className="bds-football-score-value text-[1.35rem] font-black tabular-nums leading-none text-[var(--bds-color-text)] transition-colors group-hover:text-[var(--bds-color-primary-hover)] sm:text-2xl"
          >
            {scoreLabel}
          </FootballLiveValue>
          <span className="flex flex-wrap items-center justify-center gap-[var(--bds-space-5)]">
            {timeLabel ? (
              <FootballLiveValue
                as="span"
                value={timeLabel}
                className="bds-football-time-value text-xs font-black tabular-nums text-[var(--bds-color-text-secondary)]"
              >
                {timeLabel}
              </FootballLiveValue>
            ) : null}
            {timeLabel ? <span className="text-[var(--bds-color-text-muted)]">&bull;</span> : null}
            <FootballStatusBadge match={match} />
          </span>
        </span>

        <FootballMatchTeam name={match.awayTeam} crest={match.awayCrest} align="right" />

        <span className="min-w-0 text-xs font-bold leading-tight text-[var(--bds-color-text-secondary)] md:text-right">
          <span className="block truncate">{match.competitionName || 'Competicao'}</span>
          {placeLabel ? <span className="mt-[var(--bds-space-3)] block truncate text-[var(--bds-color-text-muted)]">{placeLabel}</span> : null}
        </span>
      </button>
    </article>
  )
}, (previous, next) => (
  previous.favorited === next.favorited
  && getMatchRenderSignature(previous.match) === getMatchRenderSignature(next.match)
))
