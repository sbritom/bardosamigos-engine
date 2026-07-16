import { useEffect, useState } from 'react'
import { Alert, Badge, Card, EmptyState, Loading } from '../../../../design-system'
import { listLatestCompetitionRanking } from '../../services/competitionPredictionService'

export default function CompetitionRankingPage() {
  const [ranking, setRanking] = useState(null)
  const [scope, setScope] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const result = await listLatestCompetitionRanking(scope)
      setRanking(result.data)
      setError(result.error?.message || '')
      setLoading(false)
    }

    load()
  }, [scope])

  const items = ranking?.competitionRankingItems || ranking?.items || []

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">Ranking</div>
          <h1 className="text-3xl font-black">Bar Competition</h1>
        </div>
        <div className="flex gap-2">
          {['general', 'competition', 'season'].map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-lg border px-3 py-2 text-sm font-black ${scope === item ? 'border-[var(--bds-color-primary)] bg-[var(--bds-color-primary)] text-[var(--bds-color-text)]' : 'border-[var(--bds-color-border)] bg-[var(--bds-color-surface)]'}`}
              onClick={() => setScope(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert status="danger" title="Erro">{error}</Alert>}
      {loading ? <Loading label="Carregando ranking" /> : !ranking || items.length === 0 ? (
        <EmptyState title="Ranking ainda nao gerado" description="Quando os resultados forem lancados, o ranking aparecera aqui." />
      ) : (
        <Card className="overflow-hidden rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-[var(--bds-color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Posicao</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Pontuacao</th>
                  <th className="px-4 py-3">Acertos</th>
                  <th className="px-4 py-3">Placares exatos</th>
                  <th className="px-4 py-3">Aproveitamento</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const profile = item.profiles || {}
                  const predictionsCount = Number(item.predictionsCount || item.predictions_count || 0)
                  const hits = Number(item.resultHits || item.result_hits || 0)
                  const usage = predictionsCount > 0 ? Math.round((hits / predictionsCount) * 100) : 0
                  return (
                    <tr key={item.id || item.profileId} className="border-b border-[var(--bds-color-border)] last:border-0">
                      <td className="px-4 py-3"><Badge>{item.position}</Badge></td>
                      <td className="px-4 py-3 font-black">{profile.displayName || profile.username || item.profileId}</td>
                      <td className="px-4 py-3 text-[var(--bds-color-primary-hover)] font-black">{item.points}</td>
                      <td className="px-4 py-3">{hits}</td>
                      <td className="px-4 py-3">{item.exactHits || item.exact_hits || 0}</td>
                      <td className="px-4 py-3">{usage}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  )
}
