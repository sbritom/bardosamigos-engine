import { CalendarDays, MapPin, Play, Trophy } from 'lucide-react'
import { ActionButton, EmptyState, HeroCard, StatusBadge } from '../../../../design-system'
import { formatBrazilDateTime, nowUtcIso } from '../../../../core/time'
import { getLiveMatchCenter } from '../../../../modules/competition/services/liveMatchCenterService'
import { useCountdown } from '../hooks/useCountdown'

function formatCountdown(remaining) {
  return remaining.label || `${String(remaining.hours).padStart(2, '0')}h ${String(remaining.minutes).padStart(2, '0')}m`
}

function formatDateTime(value) {
  return formatBrazilDateTime(value)
}

function TeamBlock({ name, label, src, side }) {
  const displayName = name || 'Time'
  const fallbackLabel = label || displayName.slice(0, 3).toUpperCase()

  return (
    <div className={`bds-hero-v2-team bds-hero-v2-team--${side}`} data-designer-id={`hero.${side}Team`} data-designer-label={`Hero / ${side === 'home' ? 'Time Mandante' : 'Time Visitante'}`}>
      <div className="bds-hero-v2-crest" data-designer-id={`hero.${side}Crest`} data-designer-label={`Hero / Escudo ${side === 'home' ? 'Mandante' : 'Visitante'}`}>
        {src ? <img src={src} alt="" loading="lazy" /> : fallbackLabel}
      </div>
      <strong data-designer-id={`hero.${side}Name`} data-designer-label={`Hero / Nome ${side === 'home' ? 'Mandante' : 'Visitante'}`}>{displayName}</strong>
    </div>
  )
}

export function HeroMatchCenterV2({ liveMatchCenter }) {
  const baseMatch = liveMatchCenter?.match || null
  const remaining = useCountdown(baseMatch?.startsAt || nowUtcIso())
  const hero = getLiveMatchCenter([], {
    match: baseMatch,
    countdownLabel: formatCountdown(remaining),
    formattedDateTime: formatDateTime(baseMatch?.startsAt),
  })

  if (hero.isEmpty) {
    return (
      <HeroCard className="bds-hero-v2">
        <EmptyState
          title="Nenhuma partida disponivel"
          description="Assim que houver jogos sincronizados, o destaque aparece aqui automaticamente."
          actionLabel="Abrir Competition"
          onAction={() => { window.location.href = '/football' }}
        />
      </HeroCard>
    )
  }

  return (
    <HeroCard className="bds-hero-v2">
      <section className="bds-hero-v2-content" aria-label={`${hero.homeTeam} contra ${hero.awayTeam}`}>
        <div className="bds-hero-v2-match" data-designer-id="hero.match" data-designer-label="Hero / Confronto">
          <TeamBlock name={hero.homeTeam} label={hero.homeShield} src={hero.homeCrest} side="home" />
          <strong className="bds-hero-v2-score" data-designer-id="hero.score" data-designer-label="Hero / Placar">{hero.score}</strong>
          <TeamBlock name={hero.awayTeam} label={hero.awayShield} src={hero.awayCrest} side="away" />
        </div>

        <div className="bds-hero-v2-meta" data-designer-id="hero.meta" data-designer-label="Hero / Meta">
          <span data-designer-id="hero.status" data-designer-label="Hero / Status"><StatusBadge status={hero.displayStatus} tone={hero.statusTone}>{hero.displayStatus}</StatusBadge></span>
          <span className="bds-hero-v2-meta-divider">•</span>
          <div className="bds-hero-v2-competition" data-designer-id="hero.competition" data-designer-label="Hero / Competicao">
            {hero.competitionLogo ? <img src={hero.competitionLogo} alt="" loading="lazy" /> : <Trophy size={16} />}
            <span>{hero.competition}</span>
          </div>
        </div>

        {hero.infoItems.length > 0 && (
          <div className="bds-hero-v2-info" data-designer-id="hero.info" data-designer-label="Hero / Informacoes">
            {hero.infoItems.map((item, index) => (
              <span key={item}>
                {index === 0 ? <CalendarDays size={13} /> : <MapPin size={13} />}
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="bds-hero-v2-actions" data-designer-id="hero.buttons" data-designer-label="Hero / Botoes">
          {hero.showTvButton && (
            <span data-designer-id="hero.watchButton" data-designer-label="Hero / Botao Assistir"><ActionButton icon={<Play size={16} />} variant="secondary" onClick={() => { window.location.href = '/tv' }}>
              Assistir
            </ActionButton></span>
          )}
          {hero.showCompetitionButton && (
            <span data-designer-id="hero.competitionButton" data-designer-label="Hero / Botao Competition"><ActionButton icon={<Trophy size={16} />} onClick={() => { window.location.href = '/football' }}>
              Competition
            </ActionButton></span>
          )}
        </div>
      </section>
    </HeroCard>
  )
}
