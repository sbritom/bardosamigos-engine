import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Loading, StatCard } from '../../../../design-system'
import { formatBrazilFullDateTime } from '../../../../core/time'
import { getFootballMatchDetails } from '../../services/footballCenterService'

function score(match) {
  return match?.hasScore ? `${match.homeScore} x ${match.awayScore}` : 'VS'
}

function TeamBlock({ name, crest }) {
  return (
    <div className="min-w-0 text-center">
      {crest ? <img src={crest} alt="" className="mx-auto h-20 w-20 object-contain" loading="lazy" /> : <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[var(--radius)] border border-[var(--gold)] bg-black text-[var(--gold)]">BDA</div>}
      <h2 className="mt-3 truncate text-2xl font-black">{name}</h2>
    </div>
  )
}

export default function FootballMatchDetailsPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, match: null, error: '' })

  useEffect(() => {
    let active = true
    async function load() {
      const result = await getFootballMatchDetails(matchId)
      if (active) setState({ loading: false, match: result.data, error: result.error?.message || '' })
    }
    load()
    const timer = window.setInterval(load, state.match && ['AO_VIVO', 'INTERVALO'].includes(state.match.status) ? 30000 : 60000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [matchId, state.match?.status])

  if (state.loading) return <Loading label="Carregando detalhes da partida" />
  if (state.error) return <EmptyState title="Erro ao carregar partida" description={state.error} />
  if (!state.match) return <EmptyState title="Partida não encontrada" description="O jogo pode não estar mais disponível." />

  const match = state.match
  const info = [
    ['Competição', match.competitionName],
    ['Rodada', match.round?.name],
    ['Fase', match.stage],
    ['Grupo', match.groupName],
    ['Estádio', match.venue],
    ['Cidade', match.city],
    ['País', match.country],
    ['Árbitro', match.referee || 'Não informado'],
    ['Horário Brasil', match.localDateIso ? formatBrazilFullDateTime(match.localDateIso) : formatBrazilFullDateTime(match.startsAt)],
    ['Status', match.statusLabel],
  ]

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-[var(--gold)]">Detalhes da Partida</p>
          <h1 className="text-3xl font-black">{match.homeTeam} x {match.awayTeam}</h1>
        </div>
        <Button variant="secondary" onClick={() => navigate('/football')}>Voltar para Futebol</Button>
      </div>

      <Card className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {match.competitionLogo && <img src={match.competitionLogo} alt="" className="h-7 w-7 object-contain" loading="lazy" />}
          <Badge>{match.statusLabel}</Badge>
          <span className="text-sm font-bold text-[var(--secondary)]">{match.competitionName}</span>
        </div>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamBlock name={match.homeTeam} crest={match.homeCrest} />
          <div className="text-center text-4xl font-black text-[var(--gold)]">{score(match)}</div>
          <TeamBlock name={match.awayTeam} crest={match.awayCrest} />
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {info.map(([label, value]) => <StatCard key={label} label={label} value={value || '-'} />)}
      </div>

      <Card className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-xl font-black">Estatísticas Preparadas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(match.statistics).map(([key, value]) => (
            <StatCard key={key} label={key} value={value || 'Indisponível'} />
          ))}
        </div>
      </Card>
    </section>
  )
}
