import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Loading, StatCard, Table } from '../../../../design-system'
import { formatBrazilDate, formatBrazilFullDateTime, isFinishedStatus, isLiveStatus } from '../../../../core/time'
import { getSportsStatusLabel } from '../../../../core/sports'
import { listFootballCenterData, toggleFootballFavorite } from '../../services/footballCenterService'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../services/footballAutoSyncService'

function score(match) {
  return match.hasScore ? `${match.homeScore} x ${match.awayScore}` : 'VS'
}

function TeamMark({ name, crest, onClick }) {
  return (
    <button className="flex min-w-0 items-center gap-2 text-left" type="button" onClick={onClick}>
      {crest ? <img src={crest} alt="" className="h-8 w-8 object-contain" loading="lazy" /> : <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--bds-color-surface)] text-xs font-black text-[var(--bds-color-primary-hover)]">BDA</span>}
      <span className="truncate font-black">{name}</span>
    </button>
  )
}

function MatchCard({ match, onOpen, onTeam }) {
  return (
    <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        {match.competitionLogo && <img src={match.competitionLogo} alt="" className="h-5 w-5 object-contain" loading="lazy" />}
        <Badge>{getSportsStatusLabel(match.status)}</Badge>
        <span className="text-xs font-bold uppercase text-[var(--bds-color-text-secondary)]">{match.competitionName}</span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamMark name={match.homeTeam} crest={match.homeCrest} onClick={() => onTeam(match.homeTeam)} />
        <button className="text-xl font-black text-[var(--bds-color-primary-hover)]" type="button" onClick={() => onOpen(match.id)}>{score(match)}</button>
        <div className="flex justify-end">
          <TeamMark name={match.awayTeam} crest={match.awayCrest} onClick={() => onTeam(match.awayTeam)} />
        </div>
      </div>
      <div className="mt-3 text-sm text-[var(--bds-color-text-secondary)]">
        {match.localTime || formatBrazilFullDateTime(match.startsAt)}
        {[match.venue, match.city, match.country].filter(Boolean).length ? ` Â· ${[match.venue, match.city, match.country].filter(Boolean).join(' Â· ')}` : ''}
      </div>
      <Button className="mt-4" variant="secondary" onClick={() => onOpen(match.id)}>Detalhes</Button>
    </Card>
  )
}

function MatchTeamInline({ name, crest, align = 'left' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === 'right' ? 'justify-end text-right' : ''}`}>
      {crest ? <img src={crest} alt="" className="h-7 w-7 shrink-0 object-contain" loading="lazy" /> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[var(--bds-color-surface)] text-[10px] font-black text-[var(--bds-color-primary-hover)]">BDA</span>}
      <span className="truncate text-sm font-black">{name}</span>
    </div>
  )
}

function UpcomingMatchRow({ match, onOpen }) {
  return (
    <button className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-3 text-left transition hover:border-[var(--bds-color-primary-hover)]" type="button" onClick={() => onOpen(match.id)}>
      <MatchTeamInline name={match.homeTeam} crest={match.homeCrest} />
      <div className="text-center">
        <strong className="block text-sm font-black text-[var(--bds-color-primary-hover)]">{match.localTime || formatBrazilFullDateTime(match.startsAt)}</strong>
        <span className="mt-1 block text-[11px] font-bold uppercase text-[var(--bds-color-text-secondary)]">{match.dateLabel || formatBrazilDate(match.startsAt)}</span>
      </div>
      <MatchTeamInline name={match.awayTeam} crest={match.awayCrest} align="right" />
      <span className="col-span-3 text-xs font-bold uppercase text-[var(--bds-color-text-secondary)]">{match.competitionName}</span>
    </button>
  )
}

function RecentMatchRow({ match, onOpen }) {
  return (
    <button className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-3 text-left transition hover:border-[var(--bds-color-primary-hover)]" type="button" onClick={() => onOpen(match.id)}>
      <MatchTeamInline name={match.homeTeam} crest={match.homeCrest} />
      <strong className="text-center text-lg font-black text-[var(--bds-color-primary-hover)]">{score(match)}</strong>
      <MatchTeamInline name={match.awayTeam} crest={match.awayCrest} align="right" />
      <div className="col-span-3 flex flex-wrap items-center justify-between gap-2">
        <Badge>FINALIZADO</Badge>
        <span className="text-xs font-bold uppercase text-[var(--bds-color-text-secondary)]">{match.competitionName}</span>
      </div>
    </button>
  )
}

function MatchesSection({ data, onOpen, onTeam }) {
  return (
    <Section title="PARTIDAS">
      <div className="space-y-5">
        <div>
          <h3 className="mb-3 text-sm font-black uppercase text-[var(--bds-color-danger)]">AO VIVO</h3>
          {data.live.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {data.live.map((match) => <MatchCard key={match.id} match={match} onOpen={onOpen} onTeam={onTeam} />)}
            </div>
          ) : (
            <EmptyState title="Nenhuma partida ao vivo no momento." description="" />
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black uppercase text-[var(--bds-color-warning)]">PROXIMAS PARTIDAS</h3>
          {data.upcoming.length ? (
            <div className="grid gap-3">
              {data.upcoming.slice(0, 10).map((match) => <UpcomingMatchRow key={match.id} match={match} onOpen={onOpen} />)}
            </div>
          ) : (
            <EmptyState title="Nenhuma prÃ³xima partida sincronizada." description="Novos jogos aparecerÃ£o quando forem recebidos pela integraÃ§Ã£o." />
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black uppercase text-[var(--bds-color-success)]">PARTIDAS RECENTES</h3>
          {data.finished.length ? (
            <div className="grid gap-3">
              {data.finished.slice(0, 10).map((match) => <RecentMatchRow key={match.id} match={match} onOpen={onOpen} />)}
            </div>
          ) : (
            <EmptyState title="Nenhuma partida recente sincronizada." description="Resultados finalizados aparecerÃ£o aqui automaticamente." />
          )}
        </div>
      </div>
    </Section>
  )
}

function Section({ title, children, action }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function StandingsTable({ rows }) {
  const columns = [
    { key: 'position', label: '#' },
    {
      key: 'name',
      label: 'Time',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.crest && <img src={row.crest} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
          <span className="font-bold">{row.name}</span>
        </div>
      ),
    },
    { key: 'points', label: 'Pts' },
    { key: 'played', label: 'J' },
    { key: 'wins', label: 'V' },
    { key: 'draws', label: 'E' },
    { key: 'losses', label: 'D' },
    { key: 'goalsFor', label: 'GP' },
    { key: 'goalsAgainst', label: 'GC' },
    { key: 'goalDifference', label: 'SG' },
    { key: 'lastFive', label: 'Ãšltimos 5', render: (row) => row.lastFive.join(' ') || '-' },
  ]

  return rows.length ? <Table columns={columns} rows={rows} getRowKey={(row) => row.name} /> : <EmptyState title="ClassificaÃ§Ã£o indisponÃ­vel" description="Quando houver resultados sincronizados, a tabela serÃ¡ calculada automaticamente." />
}

export default function FootballCenterPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
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

  if (state.loading) return <Loading label="Carregando central do futebol" />
  if (state.error) return <EmptyState title="NÃ£o foi possÃ­vel carregar o futebol" description={state.error} />
  if (!data) return <EmptyState title="Nenhum dado sincronizado" description="Execute a sincronizaÃ§Ã£o Football-Data para preencher a central." />

  return (
    <section className="space-y-5">
      <div className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[linear-gradient(120deg,var(--bds-color-background),var(--bds-color-surface),var(--bds-color-background))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">Futebol 100%</p>
            <h1 className="text-3xl font-black">Central do Futebol</h1>
            <p className="mt-2 text-sm text-[var(--bds-color-text-secondary)]">Atualizado em {data.lastUpdatedAt}. Dados servidos pelo Supabase.</p>
          </div>
          <Button onClick={() => navigate('/palpites')}>Abrir Competition</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Ao vivo" value={data.live.length} />
        <StatCard label="PrÃ³ximos" value={data.upcoming.length} />
        <StatCard label="Finalizados" value={data.finished.length} />
        <StatCard label="CompetiÃ§Ãµes" value={data.competitions.length} />
      </div>

      <Section title="Jogo em Destaque">
        {data.featured ? <MatchCard match={data.featured} onOpen={(id) => navigate(`/football/jogos/${id}`)} onTeam={openTeamByName} /> : <EmptyState title="Nenhum jogo sincronizado" description="O destaque aparece automaticamente quando houver partidas." />}
      </Section>

      <MatchesSection data={data} onOpen={(id) => navigate(`/football/jogos/${id}`)} onTeam={openTeamByName} />

      <Section title="ClassificaÃ§Ã£o Completa">
        <StandingsTable rows={data.standings} />
      </Section>

      <Section title="InformaÃ§Ãµes da CompetiÃ§Ã£o">
        <div className="grid gap-3 xl:grid-cols-3">
          {data.competitions.map((competition) => (
            <Card key={competition.id} className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-4">
              <div className="flex items-center gap-3">
                {competition.logo && <img src={competition.logo} alt="" className="h-10 w-10 object-contain" loading="lazy" />}
                <div>
                  <h3 className="font-black">{competition.name}</h3>
                  <p className="text-sm text-[var(--bds-color-text-secondary)]">{competition.matches} jogos sincronizados</p>
                </div>
              </div>
              <Button className="mt-4" variant="secondary" onClick={() => favoriteCompetition(competition)}>
                {favoriteIds.has(`competition:${competition.id}`) ? 'Remover favorito' : 'Favoritar'}
              </Button>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Rodadas">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(data.rounds).map(([name, matches]) => <StatCard key={name} label={name} value={matches.length} hint="jogos" />)}
        </div>
      </Section>

      <Section title="Grupos">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(data.groups).map(([name, matches]) => <StatCard key={name} label={name} value={matches.length} hint="jogos" />)}
        </div>
      </Section>

      <Section title="Mata-mata">
        {data.knockout.length ? <div className="grid gap-4 xl:grid-cols-2">{data.knockout.map((match) => <MatchCard key={match.id} match={match} onOpen={(id) => navigate(`/football/jogos/${id}`)} onTeam={openTeamByName} />)}</div> : <EmptyState title="Mata-mata indisponÃ­vel" description="Quando a fase estiver sincronizada, os jogos aparecerÃ£o aqui." />}
      </Section>
    </section>
  )
}
