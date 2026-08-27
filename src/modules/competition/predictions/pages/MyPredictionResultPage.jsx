import { useEffect, useState } from 'react'
import { Alert, Badge, Card, EmptyState, Loading, StatCard } from '../../../../design-system'
import { listMyScoredPredictions } from '../../services/competitionResultService'

function formatScore(score = {}) {
  if (score.homeScore == null || score.awayScore == null) return '-'
  return `${score.homeScore} x ${score.awayScore}`
}

export default function MyPredictionResultPage() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const result = await listMyScoredPredictions()
      if (!active) return
      setPredictions(result.data)
      setAuthenticated(result.authenticated)
      setError(result.error?.message || '')
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (loading) return <Loading label="Carregando resultados dos palpites" />

  if (!authenticated) {
    return <EmptyState title="Entre para ver seus palpites" description="Acesse sua conta para acompanhar resultados e pontuacao." />
  }

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">Bar Competition</div>
        <h1 className="text-3xl font-black">Resultado do Meu Palpite</h1>
        <p className="mt-2 text-[var(--bds-color-text-secondary)]">Acompanhe seu palpite, resultado oficial e pontos ganhos.</p>
      </div>

      {error && <Alert status="danger" title="Erro">{error}</Alert>}

      {predictions.length === 0 ? (
        <EmptyState title="Nenhum resultado encontrado" description="Quando seus palpites forem pontuados, eles aparecerao aqui." />
      ) : (
        <div className="grid gap-4">
          {predictions.map((prediction) => {
            const match = prediction.competitionMatches
            const metadata = prediction.metadata || {}

            return (
              <Card key={prediction.id} className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">
                      {match?.competitionRounds?.competitionStages?.competitionSeasons?.competitions?.name || 'Competicao'}
                    </div>
                    <h2 className="text-xl font-black">
                      {match?.homeParticipant || 'Mandante'} x {match?.awayParticipant || 'Visitante'}
                    </h2>
                    <p className="text-sm text-[var(--bds-color-text-secondary)]">
                      Rodada: {match?.competitionRounds?.name || '-'}
                    </p>
                  </div>
                  <Badge>{metadata.situation || (metadata.resultHit ? 'Acertou' : 'Errou')}</Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <StatCard label="Meu palpite" value={formatScore(prediction.prediction)} />
                  <StatCard label="Resultado oficial" value={formatScore(match?.result)} />
                  <StatCard label="Pontos ganhos" value={prediction.points} />
                  <StatCard label="Placar exato" value={metadata.exactScore ? 'Sim' : 'Nao'} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
