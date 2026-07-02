import { useEffect, useState } from 'react'
import { Alert, EmptyState, Loading, Modal } from '../../../../design-system'
import { MatchPredictionCard } from '../components/MatchPredictionCard'
import { PredictionScoreForm } from '../components/PredictionScoreForm'
import {
  listCompetitionMatchesWithPredictions,
  removeCompetitionPrediction,
  saveCompetitionPrediction,
} from '../../services/competitionPredictionService'
import { sortLiveMatchCenterMatches } from '../../services/liveMatchCenterService'

export default function CompetitionPredictionsPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState(null)
  const [mode, setMode] = useState('create')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const result = await listCompetitionMatchesWithPredictions()
    setMatches(sortLiveMatchCenterMatches(result.data))
    setError(result.error?.message || '')
    setLoading(false)
  }

  useEffect(() => {
    load()
    const refreshTimer = window.setInterval(load, 60000)

    return () => window.clearInterval(refreshTimer)
  }, [])

  async function submit(score) {
    const result = await saveCompetitionPrediction(activeMatch, score, mode === 'edit' ? activeMatch.myPrediction : null)
    if (result.error) {
      setError(result.error.message)
      return
    }
    setMessage(mode === 'edit' ? 'Palpite atualizado.' : 'Palpite registrado.')
    setActiveMatch(null)
    load()
  }

  async function deletePrediction(match) {
    if (!window.confirm('Deseja excluir este palpite?')) return
    const result = await removeCompetitionPrediction(match.myPrediction, match)
    if (result.error) setError(result.error.message)
    else setMessage('Palpite excluido.')
    load()
  }

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-black uppercase text-[var(--gold)]">Bar Competition</div>
        <h1 className="text-3xl font-black">Palpites</h1>
        <p className="mt-2 text-[var(--secondary)]">Visualize jogos, faça seu palpite e edite até o horário limite.</p>
      </div>

      {message && <Alert status="success" title="Sucesso">{message}</Alert>}
      {error && <Alert status="danger" title="Erro">{error}</Alert>}

      {loading ? <Loading label="Carregando jogos" /> : matches.length === 0 ? (
        <EmptyState title="Nenhum jogo disponivel" description="Quando houver jogos cadastrados, eles aparecerao aqui." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {matches.map((match) => (
            <MatchPredictionCard
              key={match.id}
              match={match}
              onPredict={(selectedMatch) => { setMode('create'); setActiveMatch(selectedMatch) }}
              onEdit={(selectedMatch) => { setMode('edit'); setActiveMatch(selectedMatch) }}
              onDelete={deletePrediction}
            />
          ))}
        </div>
      )}

      <Modal open={Boolean(activeMatch)} title={mode === 'edit' ? 'Editar palpite' : 'Fazer palpite'} onClose={() => setActiveMatch(null)}>
        <PredictionScoreForm
          initialValue={activeMatch?.myPrediction?.prediction}
          submitLabel={mode === 'edit' ? 'Atualizar palpite' : 'Confirmar palpite'}
          onSubmit={submit}
        />
      </Modal>
    </section>
  )
}
