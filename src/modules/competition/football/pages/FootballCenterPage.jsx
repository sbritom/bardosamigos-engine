import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Loading, StatCard } from '../../../../design-system'
import {
  formatBrazilDate,
  formatBrazilFullDateTime,
  getBrazilDateKey,
  getRelativeBrazilDayLabel,
  getUtcTimestamp,
  isFinishedStatus,
  isLiveStatus,
  nowUtcIso,
} from '../../../../core/time'
import { getSportsStatusLabel } from '../../../../core/sports'
import { listFootballCenterData, toggleFootballFavorite } from '../../services/footballCenterService'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../services/footballAutoSyncService'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'live', label: 'Ao Vivo' },
  { id: 'today', label: 'Hoje' },
  { id: 'results', label: 'Resultados' },
  { id: 'upcoming', label: 'Proximos' },
  { id: 'competitions', label: 'Competicoes' },
]

const WORLD_CUP_STAGES = [
  'Grupos',
  '16 avos',
  'Oitavas',
  'Quartas',
  'Semifinal',
  'Final',
]

function score(match) {
  return match?.hasScore ? `${match.homeScore} x ${match.awayScore}` : 'VS'
}

function getMatchTime(match) {
  return match?.localTime || (match?.startsAt ? formatBrazilFullDateTime(match.startsAt) : '')
}

function isTodayMatch(match, now = nowUtcIso()) {
  if (!match?.startsAt) return false
  return getBrazilDateKey(match.startsAt) === getBrazilDateKey(now)
}

function getRecentResults(matches = []) {
  return matches
    .filter((match) => isFinishedStatus(match.status))
    .sort((left, right) => getUtcTimestamp(right.startsAt) - getUtcTimestamp(left.startsAt))
}

function getTodayMatches(matches = [], now = nowUtcIso()) {
  return matches
    .filter((match) => isTodayMatch(match, now) && !isLiveStatus(match.status))
    .sort((left, right) => getUtcTimestamp(left.startsAt) - getUtcTimestamp(right.startsAt))
}

function getUpcomingMatches(matches = [], now = nowUtcIso()) {
  return matches
    .filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status) && getUtcTimestamp(match.startsAt) >= getUtcTimestamp(now))
    .sort((left, right) => getUtcTimestamp(left.startsAt) - getUtcTimestamp(right.startsAt))
}

function selectHeroMatch(data, now = nowUtcIso()) {
  const matches = data?.matches || []
  const live = matches.filter((match) => isLiveStatus(match.status))
  const today = getTodayMatches(matches, now)
  const results = getRecentResults(matches)
  const upcoming = getUpcomingMatches(matches, now)

  return live[0] || today[0] || results[0] || upcoming[0] || data?.featured || matches[0] || null
}

function getStatusBadgeClass(status) {
  if (isLiveStatus(status)) return 'border-[var(--bds-color-danger)] bg-[color-mix(in_srgb,var(--bds-color-danger)_14%,transparent)] text-[var(--bds-color-danger)]'
  if (isFinishedStatus(status)) return 'border-[var(--bds-color-success)] bg-[color-mix(in_srgb,var(--bds-color-success)_14%,transparent)] text-[var(--bds-color-success)]'
  if (String(status || '').toUpperCase().includes('ADIADO')) return 'border-[var(--bds-color-warning)] bg-[color-mix(in_srgb,var(--bds-color-warning)_14%,transparent)] text-[var(--bds-color-warning)]'
  return 'border-[var(--bds-color-info)] bg-[color-mix(in_srgb,var(--bds-color-info)_14%,transparent)] text-[var(--bds-color-info)]'
}

function MatchStatusBadge({ status, children }) {
  const label = children || getSportsStatusLabel(status)
  return <Badge className={getStatusBadgeClass(status)}>{label}</Badge>
}

function Section({ title, eyebrow, children, action }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bds-color-surface)_80%,transparent),color-mix(in_srgb,var(--bds-color-background)_94%,transparent))] p-5 shadow-[0_18px_50px_color-mix(in_srgb,var(--bds-color-glow)_10%,transparent)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--bds-color-primary-hover)]">{eyebrow}</p> : null}
          <h2 className="text-xl font-black uppercase tracking-[0.04em] text-[var(--bds-color-text)]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function FootballEmptyState({ title, description }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-background)_82%,transparent)] p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] text-2xl">⚽</div>
      <h3 className="mt-3 text-base font-black text-[var(--bds-color-text)]">{title}</h3>
      {description ? <p className="mt-1 text-sm text-[var(--bds-color-text-secondary)]">{description}</p> : null}
    </div>
  )
}

function TeamMark({ name, crest, onClick, align = 'left', large = false }) {
  const imageSize = large ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-10 w-10'
  const textClass = large ? 'text-lg sm:text-2xl' : 'text-sm'

  return (
    <button
      className={`flex min-w-0 items-center gap-3 text-left transition hover:text-[var(--bds-color-primary-hover)] ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}
      type="button"
      onClick={onClick}
    >
      {crest ? (
        <img src={crest} alt="" className={`${imageSize} shrink-0 object-contain`} loading="lazy" />
      ) : (
        <span className={`${imageSize} flex shrink-0 items-center justify-center rounded-[var(--bds-radius-sm)] border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-xs font-black text-[var(--bds-color-primary-hover)]`}>BDA</span>
      )}
      <span className={`${textClass} min-w-0 font-black text-[var(--bds-color-text)]`}>{name || 'Time'}</span>
    </button>
  )
}

function FootballHero({ match, onOpen, onTeam }) {
  if (!match) {
    return (
      <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[linear-gradient(135deg,var(--bds-color-background),color-mix(in_srgb,var(--bds-color-primary)_28%,var(--bds-color-surface)),var(--bds-color-background))] p-6 shadow-[0_24px_70px_color-mix(in_srgb,var(--bds-color-glow)_18%,transparent)]">
        <FootballEmptyState title="Nenhuma partida sincronizada" description="A central sera preenchida automaticamente quando houver dados de futebol." />
      </section>
    )
  }

  const place = [match.venue || match.stadium, match.city, match.country].filter(Boolean).join(' · ')
  const stage = [match.competitionName, match.stage].filter(Boolean).join(' · ')

  return (
    <section className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[linear-gradient(135deg,var(--bds-color-background),color-mix(in_srgb,var(--bds-color-primary)_34%,var(--bds-color-surface)),var(--bds-color-background))] p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--bds-color-glow)_18%,transparent)]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-x-0 bottom-0 h-1/2 border-t border-[var(--bds-color-border)] bg-[radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--bds-color-primary-hover)_24%,transparent),transparent_58%)]" />
        <div className="absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full border border-[var(--bds-color-border)]" />
        <div className="absolute inset-x-8 top-16 h-28 rounded-[var(--radius)] border border-[var(--bds-color-border)]" />
      </div>

      <div className="relative z-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--bds-color-primary-hover)]">⚽ CENTRAL DO FUTEBOL</p>
            <h1 className="mt-1 text-2xl font-black text-[var(--bds-color-text)] sm:text-4xl">Football Center Premium</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--bds-color-text-secondary)]">Acompanhe partidas ao vivo, resultados, classificacoes e as principais competicoes.</p>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>

        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <TeamMark name={match.homeTeam} crest={match.homeCrest} large onClick={() => onTeam(match.homeTeam)} />
          <button
            className="mx-auto min-w-36 rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-background)_82%,transparent)] px-6 py-4 text-center text-4xl font-black text-[var(--bds-color-primary-hover)] shadow-[0_16px_45px_color-mix(in_srgb,var(--bds-color-glow)_12%,transparent)] transition hover:border-[var(--bds-color-primary-hover)] hover:bg-[var(--bds-color-primary)] hover:text-[var(--bds-color-text)]"
            type="button"
            onClick={() => onOpen(match.id)}
          >
            {score(match)}
          </button>
          <TeamMark name={match.awayTeam} crest={match.awayCrest} align="right" large onClick={() => onTeam(match.awayTeam)} />
        </div>

        <div className="mt-6 grid gap-3 text-sm text-[var(--bds-color-text-secondary)] md:grid-cols-2 xl:grid-cols-4">
          <InfoPill label="Competicao" value={stage || 'Competicao'} />
          <InfoPill label="Data" value={match.startsAt ? `${getRelativeBrazilDayLabel(match.startsAt)} · ${formatBrazilDate(match.startsAt)}` : '-'} />
          <InfoPill label="Horario" value={getMatchTime(match) || '-'} />
          <InfoPill label="Local" value={place || 'Local nao informado'} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold uppercase text-[var(--bds-color-text-secondary)]">
          <span>Ultima atualizacao: {match.lastSyncedAt ? formatBrazilFullDateTime(match.lastSyncedAt) : 'sincronizacao recente'}</span>
          <Button variant="secondary" onClick={() => onOpen(match.id)}>Ver detalhes</Button>
        </div>
      </div>
    </section>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_76%,transparent)] p-3">
      <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bds-color-primary-hover)]">{label}</span>
      <strong className="mt-1 block text-sm font-black text-[var(--bds-color-text)]">{value}</strong>
    </div>
  )
}

function FootballStatsCards({ stats }) {
  const cards = [
    { icon: '🔴', label: 'Jogos ao vivo', value: stats.live, hint: 'em andamento' },
    { icon: '🏁', label: 'Finalizados hoje', value: stats.finishedToday, hint: 'resultados do dia' },
    { icon: '📅', label: 'Proximos jogos', value: stats.upcoming, hint: 'agenda sincronizada' },
    { icon: '🏆', label: 'Competicoes ativas', value: stats.competitions, hint: 'em monitoramento' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_76%,transparent)] p-4 shadow-[0_14px_38px_color-mix(in_srgb,var(--bds-color-glow)_8%,transparent)] transition hover:border-[var(--bds-color-primary-hover)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_14%,var(--bds-color-surface))]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-xl">{card.icon}</span>
            <div>
              <strong className="block text-2xl font-black text-[var(--bds-color-text)]">{card.value}</strong>
              <span className="text-xs font-black uppercase tracking-[0.08em] text-[var(--bds-color-primary-hover)]">{card.label}</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--bds-color-text-secondary)]">{card.hint}</p>
        </Card>
      ))}
    </div>
  )
}

function FootballFilterBar({ activeFilter, onChange }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_74%,transparent)] p-2">
      <div className="flex min-w-max gap-2">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.id
          return (
            <button
              key={filter.id}
              className={`rounded-[var(--bds-radius-md)] border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition ${active ? 'border-[var(--bds-color-primary-hover)] bg-[var(--bds-color-primary)] text-[var(--bds-color-text)] shadow-[0_10px_24px_color-mix(in_srgb,var(--bds-color-glow)_12%,transparent)]' : 'border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-[var(--bds-color-text-secondary)] hover:border-[var(--bds-color-primary-hover)] hover:text-[var(--bds-color-text)]'}`}
              type="button"
              onClick={() => onChange(filter.id)}
            >
              {filter.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MatchTeamInline({ name, crest, align = 'left' }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${align === 'right' ? 'justify-end text-right' : ''}`}>
      {crest ? (
        <img src={crest} alt="" className="h-9 w-9 shrink-0 object-contain" loading="lazy" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--bds-radius-sm)] border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-[10px] font-black text-[var(--bds-color-primary-hover)]">BDA</span>
      )}
      <span className="truncate text-sm font-black text-[var(--bds-color-text)]">{name || 'Time'}</span>
    </div>
  )
}

function FootballMatchCard({ match, onOpen, compact = false }) {
  const stage = [match.competitionName, match.stage].filter(Boolean).join(' · ')
  return (
    <button
      className="w-full rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_76%,transparent)] p-4 text-left shadow-[0_12px_32px_color-mix(in_srgb,var(--bds-color-glow)_8%,transparent)] transition hover:border-[var(--bds-color-primary-hover)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_14%,var(--bds-color-surface))]"
      type="button"
      onClick={() => onOpen(match.id)}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <MatchStatusBadge status={match.status}>{isFinishedStatus(match.status) ? 'FINALIZADO' : undefined}</MatchStatusBadge>
        <span className="text-xs font-bold uppercase text-[var(--bds-color-text-secondary)]">{getMatchTime(match) || formatBrazilDate(match.startsAt)}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <MatchTeamInline name={match.homeTeam} crest={match.homeCrest} />
        <strong className={`${compact ? 'text-lg' : 'text-2xl'} rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] px-4 py-2 text-center font-black text-[var(--bds-color-primary-hover)]`}>{score(match)}</strong>
        <MatchTeamInline name={match.awayTeam} crest={match.awayCrest} align="right" />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase text-[var(--bds-color-text-secondary)]">
        <span>{stage || 'Competicao'}</span>
        <span>{match.dateLabel || formatBrazilDate(match.startsAt)}</span>
      </div>
    </button>
  )
}

function FootballLiveSection({ matches, onOpen }) {
  return (
    <Section title="Ao Vivo" eyebrow="Prioridade maxima">
      {matches.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {matches.map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} />)}
        </div>
      ) : (
        <FootballEmptyState title="Nenhuma partida ao vivo neste momento." description="Quando uma partida entrar em andamento, ela aparece primeiro aqui." />
      )}
    </Section>
  )
}

function FootballTodaySection({ matches, onOpen }) {
  return (
    <Section title="Hoje" eyebrow="Agenda do dia">
      {matches.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {matches.map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} compact />)}
        </div>
      ) : (
        <FootballEmptyState title="Nenhum jogo de hoje." description="A central mostra resultados recentes quando nao houver jogos no dia." />
      )}
    </Section>
  )
}

function FootballResultsSection({ matches, onOpen }) {
  return (
    <Section title="Ultimos Resultados" eyebrow="Placares recentes" action={<Button variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Ver Todos</Button>}>
      {matches.length ? (
        <div className="grid gap-3">
          {matches.slice(0, 8).map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} compact />)}
        </div>
      ) : (
        <FootballEmptyState title="Nenhum resultado sincronizado." description="Resultados finalizados entram automaticamente apos a sincronizacao." />
      )}
    </Section>
  )
}

function FootballUpcomingSection({ matches, onOpen }) {
  return (
    <Section title="Proximos Jogos" eyebrow="Calendario" action={<Button variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Ver Todos</Button>}>
      {matches.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {matches.slice(0, 10).map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} compact />)}
        </div>
      ) : (
        <FootballEmptyState title="Nenhuma proxima partida sincronizada." description="Novos jogos aparecem quando forem recebidos pela integracao." />
      )}
    </Section>
  )
}

function FootballWorldCupSection({ matches, upcoming, results, onOpen }) {
  const worldCupMatches = matches.filter((match) => ['WC', 'FIFA World Cup'].includes(match.competitionCode) || /copa do mundo|world cup/i.test(match.competitionName || ''))
  const currentMatch = selectHeroMatch({ matches: worldCupMatches })
  const currentStage = currentMatch?.stage || results[0]?.stage || upcoming[0]?.stage || 'Grupos'
  const activeStageIndex = Math.max(0, WORLD_CUP_STAGES.findIndex((stage) => currentStage.toLowerCase().includes(stage.toLowerCase().split(' ')[0])))
  const nextRound = upcoming.filter((match) => worldCupMatches.some((item) => item.id === match.id)).slice(0, 4)

  return (
    <Section title="Copa do Mundo" eyebrow="Bloco especial">
      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-background)_76%,transparent)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--bds-color-primary-hover)]">Fase atual</p>
          <h3 className="mt-1 text-2xl font-black text-[var(--bds-color-text)]">{currentStage || 'Copa do Mundo'}</h3>
          <div className="mt-5 grid gap-2">
            {WORLD_CUP_STAGES.map((stage, index) => {
              const active = index === activeStageIndex || stage.toLowerCase() === String(currentStage).toLowerCase()
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-[var(--bds-color-primary-hover)]' : 'bg-[var(--bds-color-border)]'}`} />
                  <span className={`text-sm font-bold ${active ? 'text-[var(--bds-color-text)]' : 'text-[var(--bds-color-text-secondary)]'}`}>{stage}</span>
                  <span className="h-px flex-1 bg-[var(--bds-color-border)]" />
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[var(--bds-color-text)]">Proxima Rodada</h3>
          {nextRound.length ? (
            <div className="grid gap-3">
              {nextRound.map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} compact />)}
            </div>
          ) : (
            <FootballEmptyState title="Proxima rodada indisponivel." description="Quando houver confrontos definidos, eles aparecem neste bloco." />
          )}
        </div>
      </div>
    </Section>
  )
}

function FootballCompetitionCard({ competition, favorited, onFavorite }) {
  const progress = Math.min(100, Math.max(8, Number(competition.matches || 0) * 8))
  return (
    <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_76%,transparent)] p-4 shadow-[0_12px_32px_color-mix(in_srgb,var(--bds-color-glow)_8%,transparent)] transition hover:border-[var(--bds-color-primary-hover)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_14%,var(--bds-color-surface))]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-background)]">
          {competition.logo ? <img src={competition.logo} alt="" className="h-9 w-9 object-contain" loading="lazy" /> : <span className="text-xs font-black text-[var(--bds-color-primary-hover)]">{competition.code || 'BDA'}</span>}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-black text-[var(--bds-color-text)]">{competition.name}</h3>
          <p className="text-sm text-[var(--bds-color-text-secondary)]">{competition.matches} jogos sincronizados</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bds-color-background)]">
          <div className="h-full rounded-full bg-[var(--bds-color-primary-hover)]" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <Badge className="border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-[var(--bds-color-text-secondary)]">{competition.code || 'Ativa'}</Badge>
          <Button variant="secondary" onClick={onFavorite}>{favorited ? 'Favorita' : 'Favoritar'}</Button>
        </div>
      </div>
    </Card>
  )
}

function FootballCompetitionGrid({ competitions, favoriteIds, onFavorite }) {
  return (
    <Section title="Competicoes" eyebrow="Torneios monitorados">
      {competitions.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {competitions.map((competition) => (
            <FootballCompetitionCard
              key={competition.id}
              competition={competition}
              favorited={favoriteIds.has(`competition:${competition.id}`)}
              onFavorite={() => onFavorite(competition)}
            />
          ))}
        </div>
      ) : (
        <FootballEmptyState title="Nenhuma competicao sincronizada." description="As competicoes aparecem apos a leitura dos jogos." />
      )}
    </Section>
  )
}

function FootballBottomStats({ stats }) {
  return (
    <Section title="Estatisticas" eyebrow="Resumo geral">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Jogos" value={stats.total} />
        <StatCard label="Ao Vivo" value={stats.live} />
        <StatCard label="Hoje" value={stats.today} />
        <StatCard label="Finalizados" value={stats.finished} />
        <StatCard label="Proximos" value={stats.upcoming} />
        <StatCard label="Competicoes" value={stats.competitions} />
      </div>
    </Section>
  )
}

function FootballSkeleton() {
  return (
    <section className="space-y-5">
      <div className="h-72 animate-pulse rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_70%,transparent)]" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_62%,transparent)]" />)}
      </div>
      <Loading label="Carregando central do futebol" />
    </section>
  )
}

export default function FootballCenterPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [activeFilter, setActiveFilter] = useState('all')
  const data = state.data
  const hasLiveMatchRef = useRef(false)

  async function load({ syncFirst = false } = {}) {
    if (syncFirst) {
      await syncFootballBeforeRead({ hasLiveMatch: hasLiveMatchRef.current })
    }

    const result = await listFootballCenterData()
    hasLiveMatchRef.current = hasLiveFootballMatch(result.data)
    setState({ loading: false, data: result.data, error: result.error?.message || '' })
  }

  useEffect(() => {
    let active = true
    let timer = null

    async function safeLoad() {
      await syncFootballBeforeRead({ hasLiveMatch: hasLiveMatchRef.current })
      const result = await listFootballCenterData()
      if (active) {
        hasLiveMatchRef.current = hasLiveFootballMatch(result.data)
        setState({ loading: false, data: result.data, error: result.error?.message || '' })
        timer = window.setTimeout(safeLoad, getFootballAutoSyncInterval(hasLiveMatchRef.current))
      }
    }

    safeLoad()
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const derived = useMemo(() => {
    const now = nowUtcIso()
    const matches = data?.matches || []
    const live = matches.filter((match) => isLiveStatus(match.status))
    const today = getTodayMatches(matches, now)
    const finishedToday = today.filter((match) => isFinishedStatus(match.status))
    const results = getRecentResults(matches)
    const upcoming = getUpcomingMatches(matches, now)

    return {
      hero: selectHeroMatch(data, now),
      live,
      today,
      results,
      upcoming,
      stats: {
        total: matches.length,
        live: live.length,
        today: today.length,
        finishedToday: finishedToday.length,
        finished: results.length,
        upcoming: upcoming.length,
        competitions: data?.competitions?.length || 0,
      },
    }
  }, [data])

  const favoriteIds = useMemo(() => new Set((data?.favorites || []).map((item) => `${item.favoriteType}:${item.favoriteId}`)), [data?.favorites])

  async function favoriteCompetition(competition) {
    const result = await toggleFootballFavorite({
      type: 'competition',
      id: competition.id,
      metadata: { name: competition.name, code: competition.code, logo: competition.logo },
    })
    if (!result.error) load()
  }

  function openTeamByName(name) {
    const team = data?.teams?.find((item) => item.name === name)
    if (team) navigate(`/football/times/${team.id}`)
  }

  function openMatch(matchId) {
    navigate(`/football/jogos/${matchId}`)
  }

  if (state.loading) return <FootballSkeleton />
  if (state.error) return <EmptyState title="Nao foi possivel carregar o futebol" description={state.error} />
  if (!data) return <EmptyState title="Nenhum dado sincronizado" description="Execute a sincronizacao Football-Data para preencher a central." />

  const showLive = ['all', 'live'].includes(activeFilter)
  const showToday = ['all', 'today'].includes(activeFilter)
  const showResults = ['all', 'results'].includes(activeFilter)
  const showUpcoming = ['all', 'upcoming'].includes(activeFilter)
  const showCompetitions = ['all', 'competitions'].includes(activeFilter)

  return (
    <section className="space-y-5">
      <FootballHero match={derived.hero} onOpen={openMatch} onTeam={openTeamByName} />
      <FootballStatsCards stats={derived.stats} />
      <FootballFilterBar activeFilter={activeFilter} onChange={setActiveFilter} />

      {showLive ? <FootballLiveSection matches={derived.live} onOpen={openMatch} /> : null}
      {showToday ? <FootballTodaySection matches={derived.today} onOpen={openMatch} /> : null}
      {showResults ? <FootballResultsSection matches={derived.results} onOpen={openMatch} /> : null}
      {showUpcoming ? <FootballUpcomingSection matches={derived.upcoming} onOpen={openMatch} /> : null}
      {showCompetitions ? <FootballWorldCupSection matches={data.matches || []} upcoming={derived.upcoming} results={derived.results} onOpen={openMatch} /> : null}
      {showCompetitions ? <FootballCompetitionGrid competitions={data.competitions || []} favoriteIds={favoriteIds} onFavorite={favoriteCompetition} /> : null}
      {activeFilter === 'all' ? <FootballBottomStats stats={derived.stats} /> : null}
    </section>
  )
}
