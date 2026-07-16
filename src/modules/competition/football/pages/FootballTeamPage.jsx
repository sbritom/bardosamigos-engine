import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Loading, StatCard, Table } from '../../../../design-system'
import { formatBrazilFullDateTime } from '../../../../core/time'
import { getSportsStatusLabel } from '../../../../core/sports'
import { getFootballTeamDetails, toggleFootballFavorite } from '../../services/footballCenterService'

function score(match) {
  return match.hasScore ? `${match.homeScore} x ${match.awayScore}` : 'VS'
}

function MatchRow({ match, onOpen }) {
  return (
    <button className="w-full rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] p-3 text-left" type="button" onClick={() => onOpen(match.id)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{getSportsStatusLabel(match.status)}</Badge>
        <span className="text-xs font-bold uppercase text-[var(--bds-color-text-secondary)]">{match.competitionName}</span>
      </div>
      <div className="mt-2 font-black">{match.homeTeam} <span className="text-[var(--bds-color-primary-hover)]">{score(match)}</span> {match.awayTeam}</div>
      <div className="mt-1 text-sm text-[var(--bds-color-text-secondary)]">{formatBrazilFullDateTime(match.startsAt)}</div>
    </button>
  )
}

function TeamStandings({ rows, teamName }) {
  const filtered = rows.filter((row) => row.name === teamName || rows.length <= 8)
  const columns = [
    { key: 'position', label: '#' },
    { key: 'name', label: 'Time' },
    { key: 'points', label: 'Pts' },
    { key: 'played', label: 'J' },
    { key: 'wins', label: 'V' },
    { key: 'draws', label: 'E' },
    { key: 'losses', label: 'D' },
    { key: 'goalDifference', label: 'SG' },
    { key: 'lastFive', label: 'Últimos 5', render: (row) => row.lastFive.join(' ') || '-' },
  ]

  return filtered.length ? <Table columns={columns} rows={filtered} getRowKey={(row) => row.name} /> : <EmptyState title="Classificação indisponível" description="Sem resultados suficientes para calcular a posição." />
}

export default function FootballTeamPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '', message: '' })

  async function load() {
    const result = await getFootballTeamDetails(teamId)
    setState((current) => ({ ...current, loading: false, data: result.data, error: result.error?.message || '' }))
  }

  useEffect(() => {
    load()
  }, [teamId])

  async function favorite() {
    const team = state.data?.team
    if (!team) return
    const result = await toggleFootballFavorite({
      type: 'team',
      id: team.id,
      metadata: { name: team.name, crest: team.crestUrl || team.logoUrl, country: team.country },
    })
    setState((current) => ({ ...current, message: result.error?.message || (result.favorited ? 'Time favoritado.' : 'Favorito removido.') }))
  }

  if (state.loading) return <Loading label="Carregando time" />
  if (state.error) return <EmptyState title="Erro ao carregar time" description={state.error} />
  if (!state.data) return <EmptyState title="Time não encontrado" description="A equipe pode não estar sincronizada." />

  const { team, upcoming, finished, standings } = state.data
  const crest = team.crestUrl || team.crest_url || team.logoUrl || team.logo_url || team.metadata?.crest || ''

  return (
    <section className="space-y-5">
      <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {crest && <img src={crest} alt="" className="h-20 w-20 object-contain" loading="lazy" />}
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">Equipe</p>
              <h1 className="truncate text-3xl font-black">{team.name}</h1>
              <p className="mt-1 text-sm text-[var(--bds-color-text-secondary)]">{team.country || '-'} · {team.competitionName || team.competitions?.name || '-'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={favorite}>Favoritar</Button>
            <Button variant="secondary" onClick={() => navigate('/football')}>Voltar</Button>
          </div>
        </div>
        {state.message && <p className="mt-3 text-sm font-bold text-[var(--bds-color-primary-hover)]">{state.message}</p>}
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Estádio" value={team.venue || '-'} />
        <StatCard label="Website" value={team.website || '-'} />
        <StatCard label="Fundação" value={team.founded || '-'} />
        <StatCard label="Cores" value={team.clubColors || team.club_colors || '-'} />
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
          <h2 className="mb-4 text-xl font-black">Próximos Jogos</h2>
          <div className="space-y-3">
            {upcoming.length ? upcoming.slice(0, 8).map((match) => <MatchRow key={match.id} match={match} onOpen={(id) => navigate(`/football/jogos/${id}`)} />) : <EmptyState title="Sem jogos futuros" description="Novas partidas aparecerão após a sincronização." />}
          </div>
        </Card>

        <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
          <h2 className="mb-4 text-xl font-black">Últimos Jogos</h2>
          <div className="space-y-3">
            {finished.length ? finished.map((match) => <MatchRow key={match.id} match={match} onOpen={(id) => navigate(`/football/jogos/${id}`)} />) : <EmptyState title="Sem resultados" description="Resultados sincronizados aparecem aqui." />}
          </div>
        </Card>
      </section>

      <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
        <h2 className="mb-4 text-xl font-black">Classificação</h2>
        <TeamStandings rows={standings} teamName={team.name} />
      </Card>
    </section>
  )
}
