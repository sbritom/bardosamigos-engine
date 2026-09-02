import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, Target, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import { Alert, EmptyState, Loading, Modal } from '../../../../design-system'
import { formatBrazilFullDateTime, isFinishedStatus } from '../../../../core/time'
import { MatchPredictionCard } from '../components/MatchPredictionCard'
import { PredictionScoreForm } from '../components/PredictionScoreForm'
import {
  listCompetitionMatchesWithPredictions,
  listLatestCompetitionRanking,
  listMyCompetitionPredictions,
  removeCompetitionPrediction,
  saveCompetitionPrediction,
} from '../../services/competitionPredictionService'
import { sortLiveMatchCenterMatches } from '../../services/liveMatchCenterService'
import './predictionsPage.css'

function formatScore(score = {}) {
  if (score?.homeScore == null || score?.awayScore == null) return '—'
  return `${score.homeScore} x ${score.awayScore}`
}

function getCompetitionName(match = {}) {
  return match?.competitionRounds?.competitionStages?.competitionSeasons?.competitions?.name
    || match?.competitionName
    || 'Competição'
}

function getPredictionSituation(prediction = {}) {
  if (prediction.status === 'scored') {
    return prediction.metadata?.situation || (prediction.metadata?.resultHit ? 'Acertou' : 'Errou')
  }
  if (prediction.status === 'locked') return 'Aguardando resultado'
  return 'Palpite confirmado'
}

function getRankingItems(ranking) {
  return [...(ranking?.competitionRankingItems || ranking?.items || [])]
    .sort((left, right) => Number(left.position || 999) - Number(right.position || 999))
}

function getRankingName(item = {}) {
  const profile = item.profiles || {}
  return profile.username
    ? `@${String(profile.username).toUpperCase()}`
    : profile.displayName || 'Usuário'
}

function MyPredictionCard({ prediction }) {
  const match = prediction.competitionMatches || {}
  const officialScore = match.result || (
    match.homeScore != null && match.awayScore != null
      ? { homeScore: match.homeScore, awayScore: match.awayScore }
      : {}
  )
  const scored = prediction.status === 'scored'
  const situation = getPredictionSituation(prediction)

  return (
    <article className={`imortal-my-prediction ${scored ? 'is-scored' : ''}`}>
      <header>
        <div>
          <span>{getCompetitionName(match)}</span>
          <strong>{match.homeParticipant || 'Mandante'} x {match.awayParticipant || 'Visitante'}</strong>
          <small>{match.startsAt ? formatBrazilFullDateTime(match.startsAt) : 'Horário indisponível'}</small>
        </div>
        <em className={`is-${String(situation).toLowerCase().includes('acert') ? 'hit' : scored ? 'miss' : 'pending'}`}>
          {situation}
        </em>
      </header>

      <div className="imortal-my-prediction__scores">
        <div>
          <span>MEU PALPITE</span>
          <strong>{formatScore(prediction.prediction)}</strong>
        </div>
        <div>
          <span>RESULTADO OFICIAL</span>
          <strong>{formatScore(officialScore)}</strong>
        </div>
        <div>
          <span>PONTOS</span>
          <strong>{scored ? Number(prediction.points || 0) : '—'}</strong>
        </div>
        <div>
          <span>PLACAR EXATO</span>
          <strong>{scored ? (prediction.metadata?.exactScore ? 'Sim' : 'Não') : '—'}</strong>
        </div>
      </div>
    </article>
  )
}

function RankingView({ ranking, loading, error }) {
  if (loading) return <Loading label="Carregando ranking" />
  if (error) return <Alert status="danger" title="Erro">{error}</Alert>

  const items = getRankingItems(ranking)

  if (!items.length) {
    return (
      <EmptyState
        title="Ranking ainda não iniciado"
        description="Assim que os primeiros jogos com palpites forem finalizados, a classificação aparecerá aqui."
      />
    )
  }

  const podium = items.slice(0, 3)

  return (
    <>
      <section className="imortal-prediction-leader">
        <span>LÍDER ATUAL DO BOLÃO</span>
        <Trophy size={26} />
        <strong>{getRankingName(podium[0])}</strong>
        <small>{Number(podium[0]?.points || 0)} pontos</small>
      </section>

      <section className="imortal-prediction-podium" aria-label="Pódio do Bolão">
        {podium.map((item, index) => (
          <article key={item.id || item.profileId} className={index === 0 ? 'is-first' : ''}>
            <span>{index + 1}º</span>
            <strong>{getRankingName(item)}</strong>
            <small>{Number(item.points || 0)} pts</small>
          </article>
        ))}
      </section>

      <div className="imortal-prediction-ranking-wrap">
        <table className="imortal-prediction-ranking">
          <thead>
            <tr>
              <th>#</th>
              <th>Usuário</th>
              <th>Pontos</th>
              <th>Acertos</th>
              <th>Placares exatos</th>
              <th>Palpites</th>
              <th>Aproveitamento</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const predictionsCount = Number(item.predictionsCount || 0)
              const hits = Number(item.resultHits || 0)
              const usage = predictionsCount > 0 ? Math.round((hits / predictionsCount) * 100) : 0

              return (
                <tr key={item.id || item.profileId}>
                  <td><strong>{item.position}</strong></td>
                  <td><strong>{getRankingName(item)}</strong></td>
                  <td className="is-points">{Number(item.points || 0)}</td>
                  <td>{hits}</td>
                  <td>{Number(item.exactHits || 0)}</td>
                  <td>{predictionsCount}</td>
                  <td>{usage}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function CompetitionPredictionsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, requireAuth } = useAuth()
  const [activeTab, setActiveTab] = useState('games')
  const [matches, setMatches] = useState([])
  const [myPredictions, setMyPredictions] = useState([])
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [secondaryLoading, setSecondaryLoading] = useState(false)
  const [activeMatch, setActiveMatch] = useState(null)
  const [mode, setMode] = useState('create')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [secondaryError, setSecondaryError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadGames() {
    setLoading(true)
    const result = await listCompetitionMatchesWithPredictions()
    setMatches(sortLiveMatchCenterMatches(result.data))
    setError(result.error?.message || '')
    setLoading(false)
  }

  async function loadMyPredictions() {
    if (!isAuthenticated) {
      setMyPredictions([])
      setSecondaryError('')
      return
    }

    setSecondaryLoading(true)
    const result = await listMyCompetitionPredictions()
    setMyPredictions(result.data || [])
    setSecondaryError(result.error?.message || '')
    setSecondaryLoading(false)
  }

  async function loadRanking() {
    setSecondaryLoading(true)
    const result = await listLatestCompetitionRanking('general')
    setRanking(result.data)
    setSecondaryError(result.error?.message || '')
    setSecondaryLoading(false)
  }

  useEffect(() => {
    loadGames()
    const refreshTimer = window.setInterval(loadGames, 60000)
    return () => window.clearInterval(refreshTimer)
  }, [])

  useEffect(() => {
    if (activeTab === 'mine') loadMyPredictions()
    if (activeTab === 'ranking') loadRanking()
  }, [activeTab, isAuthenticated])

  function changeTab(nextTab) {
    setMessage('')
    setError('')
    setSecondaryError('')
    setActiveTab(nextTab)
  }

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
    loadGames()
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
      await loadGames()
      if (activeTab === 'mine') await loadMyPredictions()
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
    await loadGames()
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
          <p>Palpite, acompanhe seus resultados e dispute o topo do ranking.</p>
        </div>

        <button type="button" className="imortal-predictions-back" onClick={() => navigate('/football')}>
          <ArrowLeft size={16} />
          Voltar ao Futebol
        </button>
      </header>

      <nav className="imortal-predictions-tabs" aria-label="Navegação do Bolão">
        <button type="button" className={activeTab === 'games' ? 'is-active' : ''} onClick={() => changeTab('games')}>
          Jogos
        </button>
        <button type="button" className={activeTab === 'mine' ? 'is-active' : ''} onClick={() => changeTab('mine')}>
          Meus Palpites
        </button>
        <button type="button" className={activeTab === 'ranking' ? 'is-active' : ''} onClick={() => changeTab('ranking')}>
          Ranking
        </button>
      </nav>

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

      {activeTab === 'games' && (
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
      )}

      {activeTab === 'mine' && (
        <section className="imortal-predictions-section">
          <div className="imortal-predictions-section__head">
            <div>
              <span>MINHA PARTICIPAÇÃO</span>
              <h2>Meus Palpites</h2>
            </div>
            <small>Veja seu palpite, o placar oficial e os pontos conquistados.</small>
          </div>

          {!isAuthenticated ? (
            <div className="imortal-predictions-login-required">
              <Target size={24} />
              <strong>Entre para acompanhar seus palpites</strong>
              <button type="button" onClick={() => requireAuth('Entre para ver seus palpites e resultados.')}>
                Entrar
              </button>
            </div>
          ) : secondaryLoading ? (
            <Loading label="Carregando meus palpites" />
          ) : secondaryError ? (
            <Alert status="danger" title="Erro">{secondaryError}</Alert>
          ) : !myPredictions.length ? (
            <EmptyState title="Nenhum palpite encontrado" description="Faça seu primeiro palpite na aba Jogos." />
          ) : (
            <div className="imortal-my-predictions-list">
              {myPredictions.map((prediction) => <MyPredictionCard key={prediction.id} prediction={prediction} />)}
            </div>
          )}
        </section>
      )}

      {activeTab === 'ranking' && (
        <section className="imortal-predictions-section">
          <div className="imortal-predictions-section__head">
            <div>
              <span>CLASSIFICAÇÃO GERAL</span>
              <h2>Ranking do Bolão</h2>
            </div>
            <small>Mais pontos, depois mais placares exatos e mais acertos.</small>
          </div>

          <div className="imortal-ranking-content">
            <RankingView ranking={ranking} loading={secondaryLoading} error={secondaryError} />
          </div>
        </section>
      )}

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
