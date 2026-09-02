import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, Target, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import { Alert, EmptyState, Loading, Modal } from '../../../../design-system'
import { MatchPredictionCard } from '../components/MatchPredictionCard'
import { PredictionScoreForm } from '../components/PredictionScoreForm'
import {
  listCompetitionMatchesWithPredictions,
  removeCompetitionPrediction,
  saveCompetitionPrediction,
} from '../../services/competitionPredictionService'
import { sortLiveMatchCenterMatches } from '../../services/liveMatchCenterService'
import { isFinishedStatus } from '../../../../core/time'
import './predictionsPage.css'

export default function CompetitionPredictionsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, requireAuth } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState(null)
  const [mode, setMode] = useState('create')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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

  function openPrediction(selectedMatch, nextMode = 'create') {
    setMessage('')
    setError('')

    if (!isAuthenticated) {
      setPendingAction({ match: selectedMatch, mode: nextMode })
      requireAuth('Entre ou crie sua conta para participar do Bolão IMORTAL0800.')
      return
    }

    setMode(nextMode)
    setActiveMatch(selectedMatch)
  }

  useEffect(() => {
    if (!isAuthenticated || !pendingAction) return

    setMode(pendingAction.mode)
    setActiveMatch(pendingAction.match)
    setPendingAction(null)
    load()
  }, [isAuthenticated, pendingAction])

  async function submit(score) {
    if (!activeMatch || submitting) return

    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      const result = await saveCompetitionPrediction(
        activeMatch,
        score,
        mode === 'edit' ? activeMatch.myPrediction : null,
      )

      if (result.error) {
        if (!result.authenticated) {
          setPendingAction({ match: activeMatch, mode })
          setActiveMatch(null)
          requireAuth('Sua sessão expirou. Entre novamente para confirmar o palpite.')
        }
        setError(result.error.message)
        return
      }

      setMessage(mode === 'edit' ? 'Palpite atualizado.' : 'Palpite registrado.')
      setActiveMatch(null)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function deletePrediction(match) {
    if (!isAuthenticated) {
      requireAuth('Entre para gerenciar seus palpites.')
      return
    }
    if (!window.confirm('Deseja excluir este palpite?')) return

    setMessage('')
    setError('')
    const result = await removeCompetitionPrediction(match.myPrediction, match)
    if (result.error) setError(result.error.message)
    else setMessage('Palpite excluído.')
    await load()
  }

  const stats = useMemo(() => {
    const predicted = matches.filter((match) => Boolean(match.myPrediction)).length
    const closed = matches.filter((match) => (
      match.closed || isFinishedStatus(match.standardStatus || match.standard_status || match.status)
    )).length
    const open = Math.max(matches.length - closed, 0)

    return { total: matches.length, predicted, open, closed }
  }, [matches])

  return (
    <main className="imortal-predictions-page">
      <header className="imortal-predictions-hero">
        <div className="imortal-predictions-hero__content">
          <span>IMORTAL0800 • FUTEBOL</span>
          <h1>Bolão de Palpites</h1>
          <p>Escolha os placares antes do horário limite e acompanhe seus palpites em um só lugar.</p>
        </div>

        <button type="button" className="imortal-predictions-back" onClick={() => navigate('/football')}>
          <ArrowLeft size={16} />
          Voltar ao Futebol
        </button>
      </header>

      <section className="imortal-predictions-stats" aria-label="Resumo do bolão">
        <article>
          <span><Trophy size={17} /></span>
          <div><strong>{stats.total}</strong><small>jogos no bolão</small></div>
        </article>
        <article>
          <span><Clock3 size={17} /></span>
          <div><strong>{stats.open}</strong><small>abertos para palpite</small></div>
        </article>
        <article>
          <span><Target size={17} /></span>
          <div><strong>{stats.predicted}</strong><small>palpites feitos</small></div>
        </article>
        <article>
          <span><CheckCircle2 size={17} /></span>
          <div><strong>{stats.closed}</strong><small>encerrados</small></div>
        </article>
      </section>

      {message && <Alert status="success" title="Sucesso">{message}</Alert>}
      {error && <Alert status="danger" title="Erro">{error}</Alert>}

      <section className="imortal-predictions-section">
        <div className="imortal-predictions-section__head">
          <div>
            <span>JOGOS DISPONÍVEIS</span>
            <h2>Faça seus palpites</h2>
          </div>
          <small>Os palpites podem ser alterados enquanto o jogo estiver aberto.</small>
        </div>

        {loading ? <Loading label="Carregando jogos" /> : matches.length === 0 ? (
          <EmptyState title="Nenhum jogo disponível" description="Quando houver jogos cadastrados, eles aparecerão aqui." />
        ) : (
          <div className="imortal-predictions-grid">
            {matches.map((match) => (
              <MatchPredictionCard
                key={match.id}
                match={match}
                onPredict={(selectedMatch) => openPrediction(selectedMatch, 'create')}
                onEdit={(selectedMatch) => openPrediction(selectedMatch, 'edit')}
                onDelete={deletePrediction}
              />
            ))}
          </div>
        )}
      </section>

      <Modal open={Boolean(activeMatch)} title={mode === 'edit' ? 'Editar palpite' : 'Fazer palpite'} onClose={() => setActiveMatch(null)}>
        <PredictionScoreForm
          match={activeMatch}
          initialValue={activeMatch?.myPrediction?.prediction}
          submitLabel={submitting ? 'Salvando...' : mode === 'edit' ? 'Atualizar palpite' : 'Confirmar palpite'}
          disabled={submitting}
          onSubmit={submit}
        />
      </Modal>
    </main>
  )
}
