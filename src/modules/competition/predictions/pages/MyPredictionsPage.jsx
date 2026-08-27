import { useEffect, useState } from 'react'
import { Alert, Badge, Card, EmptyState, Loading, StatCard } from '../../../../design-system'
import { listMyCompetitionPredictions } from '../../services/competitionPredictionService'

function formatScore(score = {}) {
  if (score.homeScore == null || score.awayScore == null) return '-'
  return `${score.homeScore} x ${score.awayScore}`
}

export default function MyPredictionsPage() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const result = await listMyCompetitionPredictions()
      setPredictions(result.data)
      setAuthenticated(result.authenticated)
      setError(result.error?.message || '')
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <Loading label="Carregando meus palpites" />
  if (!authenticated) return <EmptyState title="Entre para ver seus palpites" description="Seus palpites ficam disponiveis apos login." />

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">Historico</div>
        <h1 className="text-3xl font-black">Meus Palpites</h1>
      </div>

      {error && <Alert status="danger" title="Erro">{error}</Alert>}

      {predictions.length === 0 ? <EmptyState title="Nenhum palpite encontrado" description="Faca seu primeiro palpite em jogos disponiveis." /> : (
        <div className="grid gap-4">
          {predictions.map((prediction) => {
            const match = prediction.competitionMatches
            return (
              <Card key={prediction.id} className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">
                      {match?.competitionRounds?.competitionStages?.competitionSeasons?.competitions?.name || 'Competicao'}
                    </div>
                    <h2 className="text-xl font-black">{match?.homeParticipant || 'Mandante'} x {match?.awayParticipant || 'Visitante'}</h2>
                    <p className="text-sm text-[var(--bds-color-text-secondary)]">{match?.competitionRounds?.name || 'Rodada'}</p>
                  </div>
                  <Badge>{prediction.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <StatCard label="Meu placar" value={formatScore(prediction.prediction)} />
                  <StatCard label="Resultado oficial" value={formatScore(match?.result)} />
                  <StatCard label="Pontos" value={prediction.points || 0} />
                  <StatCard label="Situacao" value={prediction.metadata?.situation || 'Aguardando'} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
