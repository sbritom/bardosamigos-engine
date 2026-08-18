import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button, EmptyState } from '../../../../design-system'
import { FootballBrasileiraoHub } from '../components/FootballBrasileiraoHub'
import { footballMatchBelongsToCompetition } from '../utils/footballCenterUtils'
import { listFootballCenterData } from '../../services/footballCenterService'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../services/footballAutoSyncService'
import './footballMotion.css'
import './footballTheme.css'

const BRASILEIRAO_NAV_ITEM = {
  id: 'BSA',
  codes: ['bsa'],
  patterns: ['brasileir', 'serie a brasil'],
}

export default function FootballCenterPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [refreshing, setRefreshing] = useState(false)
  const hasLiveMatchRef = useRef(false)

  async function load({ syncFirst = false } = {}) {
    try {
      if (syncFirst) {
        setRefreshing(true)
        await syncFootballBeforeRead({ hasLiveMatch: hasLiveMatchRef.current })
      }

      const result = await listFootballCenterData()
      hasLiveMatchRef.current = hasLiveFootballMatch(result.data)
      setState({ loading: false, data: result.data, error: result.error?.message || '' })
    } finally {
      setRefreshing(false)
    }
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

  const brasileiraoMatches = useMemo(() => (
    (state.data?.matches || []).filter((match) => footballMatchBelongsToCompetition(match, BRASILEIRAO_NAV_ITEM))
  ), [state.data?.matches])

  function openMatch(matchId) {
    navigate(`/football/jogos/${matchId}`)
  }

  if (state.loading) {
    return (
      <section className="bds-football-page">
        <div className="bds-football-simple-loading">Carregando futebol...</div>
      </section>
    )
  }

  if (state.error) return <EmptyState title="Nao foi possivel carregar o futebol" description={state.error} />
  if (!state.data) return <EmptyState title="Nenhum dado sincronizado" description="Execute a sincronizacao Football-Data para preencher a central." />

  return (
    <section className="bds-football-page bds-football-page--simple">
      <header className="bds-football-simple-header">
        <div>
          <span>Futebol</span>
          <h1>Brasileirão Série A</h1>
          <p>Tabela e jogos sincronizados automaticamente.</p>
        </div>
        <Button variant="secondary" onClick={() => load({ syncFirst: true })} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'bds-football-spin' : ''} aria-hidden="true" />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </header>

      {brasileiraoMatches.length ? (
        <FootballBrasileiraoHub matches={brasileiraoMatches} onOpen={openMatch} />
      ) : (
        <EmptyState title="Nenhum jogo do Brasileirão encontrado" description="Aguarde a próxima sincronização dos dados." />
      )}
    </section>
  )
}
