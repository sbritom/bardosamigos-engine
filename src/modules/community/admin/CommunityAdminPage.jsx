import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Cake, CalendarDays, Check, Eye, EyeOff, MessageCircle, Pencil, RefreshCw, Save, Trash2, Trophy, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  deleteCommunityModerationItem,
  loadCommunityModeration,
  moderateCommunityItem,
} from '../services/communityService'
import './communityAdmin.css'

function statusLabel(status) {
  const labels = { pending: 'Pendente', published: 'Publicado', hidden: 'Oculto' }
  return labels[status] || status || '-'
}

function serializeTopActive(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map((item) => [item.name || item.user?.displayName || '', item.activity ?? 0].join(' | '))
    .join('\n')
}

function serializeRanking(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map((item) => [
      item.user?.displayName || item.name || '',
      item.user?.xatId || item.xatId || '',
      item.points ?? 0,
    ].join(' | '))
    .join('\n')
}

function parseTopActive(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => {
      const [name = '', activity = '0'] = line.split('|').map((part) => part.trim())
      return { name, activity: Math.max(0, Number(activity) || 0) }
    })
    .filter((item) => item.name.length >= 2)
}

function parseRanking(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const [name = '', xatId = '', points = '0'] = line.split('|').map((part) => part.trim())
      return {
        name,
        xatId: Number(xatId) > 0 ? Number(xatId) : null,
        points: Math.max(0, Number(points) || 0),
      }
    })
    .filter((item) => item.name.length >= 2)
}

export default function CommunityAdminPage() {
  const navigate = useNavigate()
  const [data, setData] = useState({ wall: [], birthdays: [], evoxManual: null })
  const [loading, setLoading] = useState(true)
  const [onlineNow, setOnlineNow] = useState('')
  const [topActiveText, setTopActiveText] = useState('')
  const [rankingText, setRankingText] = useState('')
  const [busyId, setBusyId] = useState('')
  const [feedback, setFeedback] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setFeedback('')
    try {
      const next = await loadCommunityModeration()
      const manual = next.evoxManual || {}
      setData({
        wall: Array.isArray(next.wall) ? next.wall : [],
        birthdays: Array.isArray(next.birthdays) ? next.birthdays : [],
        evoxManual: manual,
      })
      setOnlineNow(manual.onlineNow === null || manual.onlineNow === undefined ? '' : String(manual.onlineNow))
      setTopActiveText(serializeTopActive(manual.topActive))
      setRankingText(serializeRanking(manual.ranking))
    } catch (error) {
      setFeedback(error.message || 'Não foi possível carregar a moderação.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const birthdays = useMemo(() => [...data.birthdays].sort((a, b) => {
    const weight = { pending: 0, published: 1, hidden: 2 }
    return (weight[a.status] ?? 9) - (weight[b.status] ?? 9)
  }), [data.birthdays])

  async function act(resource, id, action, extra = {}) {
    setBusyId(id)
    setFeedback('')
    try {
      await moderateCommunityItem({ resource, id, action, ...extra })
      setFeedback('Alteração salva.')
      await load()
    } catch (error) {
      setFeedback(error.message || 'Não foi possível concluir a ação.')
    } finally {
      setBusyId('')
    }
  }

  async function remove(resource, id) {
    if (!window.confirm('Excluir definitivamente este item?')) return
    setBusyId(id)
    setFeedback('')
    try {
      await deleteCommunityModerationItem({ resource, id })
      setFeedback('Item excluído.')
      await load()
    } catch (error) {
      setFeedback(error.message || 'Não foi possível excluir.')
    } finally {
      setBusyId('')
    }
  }

  async function editWall(post) {
    const authorName = window.prompt('Nome/Nick no Xat', post.authorName)
    if (authorName === null) return
    const bodyText = window.prompt('Recado', post.body)
    if (bodyText === null) return
    await act('wall', post.id, 'edit', { authorName, bodyText })
  }

  async function editBirthday(person) {
    const displayName = window.prompt('Nome/Nick no Xat', person.displayName)
    if (displayName === null) return
    const date = window.prompt('Data (DD/MM)', String(person.day).padStart(2, '0') + '/' + String(person.month).padStart(2, '0'))
    if (date === null) return
    const match = date.trim().match(/^(\d{1,2})\/(\d{1,2})$/)
    if (!match) {
      setFeedback('Data inválida. Use DD/MM.')
      return
    }
    await act('birthday', person.id, 'edit', {
      displayName,
      day: Number(match[1]),
      month: Number(match[2]),
      status: person.status,
    })
  }

  async function saveManualEvox() {
    setBusyId('evox-manual')
    setFeedback('')
    try {
      await moderateCommunityItem({
        resource: 'evox-manual',
        id: 'imortal0800',
        action: 'save',
        onlineNow: onlineNow.trim() === '' ? null : Math.max(0, Number(onlineNow) || 0),
        topActive: parseTopActive(topActiveText),
        ranking: parseRanking(rankingText),
      })
      setFeedback('Dados manuais do EVOX salvos.')
      await load()
    } catch (error) {
      setFeedback(error.message || 'Não foi possível salvar os dados manuais do EVOX.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="community-admin-page">
      <header className="community-admin-header">
        <div>
          <span>IMORTAL0800</span>
          <h1>Moderação da Comunidade</h1>
          <p>Recados, aniversariantes e eventos em um só lugar.</p>
        </div>
        <div>
          <button type="button" onClick={load} disabled={loading}><RefreshCw size={15} /> Atualizar</button>
          <button type="button" onClick={() => navigate('/events/admin')}><CalendarDays size={15} /> Eventos</button>
        </div>
      </header>

      {feedback ? <p className="community-admin-feedback">{feedback}</p> : null}

      <section className="community-admin-panel">
        <div className="community-admin-panel__title">
          <Activity size={18} />
          <div>
            <h2>EVOX — modo manual temporário</h2>
            <p>Use estes dados enquanto a API não estiver autorizada. Quando o EVOX automático funcionar, ele terá prioridade.</p>
          </div>
        </div>

        <div className="community-admin-evox-grid">
          <label>
            <span><Activity size={14} /> Usuários online agora</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={onlineNow}
              onChange={(event) => setOnlineNow(event.target.value)}
              placeholder="Ex.: 5"
            />
          </label>

          <label>
            <span><Users size={14} /> Top 10 Usuários Mais Ativos</span>
            <textarea
              rows={8}
              value={topActiveText}
              onChange={(event) => setTopActiveText(event.target.value)}
              placeholder={'Nome | Atividades\nEx.: iGianLucca | 1807'}
            />
            <small>Uma pessoa por linha: Nome | Atividades. Máximo de 10.</small>
          </label>

          <label>
            <span><Trophy size={14} /> Ranking de Pontos</span>
            <textarea
              rows={8}
              value={rankingText}
              onChange={(event) => setRankingText(event.target.value)}
              placeholder={'Nome | ID do Xat | Pontos\nEx.: iGianLucca | 1544927716 | 12500'}
            />
            <small>Uma pessoa por linha: Nome | ID do Xat | Pontos. A ordem das linhas define a posição.</small>
          </label>
        </div>

        <div className="community-admin-evox-actions">
          <small>
            Última atualização: {data.evoxManual?.updatedAt
              ? new Date(data.evoxManual.updatedAt).toLocaleString('pt-BR')
              : 'ainda não salvo'}
          </small>
          <button type="button" onClick={saveManualEvox} disabled={busyId === 'evox-manual'}>
            <Save size={15} />
            {busyId === 'evox-manual' ? 'Salvando...' : 'Salvar dados manuais'}
          </button>
        </div>
      </section>

      <section className="community-admin-panel">
        <div className="community-admin-panel__title">
          <Cake size={18} />
          <div>
            <h2>Aniversariantes</h2>
            <p>{birthdays.filter((item) => item.status === 'pending').length} aguardando aprovação</p>
          </div>
        </div>

        <div className="community-admin-list">
          {loading ? <p>Carregando...</p> : birthdays.length ? birthdays.map((person) => (
            <article key={person.id}>
              <div>
                <strong>{person.displayName}</strong>
                <span>{String(person.day).padStart(2, '0')}/{String(person.month).padStart(2, '0')} • {statusLabel(person.status)}</span>
              </div>
              <div className="community-admin-actions">
                {person.status === 'pending' ? <button onClick={() => act('birthday', person.id, 'approve')} disabled={busyId === person.id}><Check size={14} /> Aprovar</button> : null}
                {person.status === 'hidden' ? <button onClick={() => act('birthday', person.id, 'publish')} disabled={busyId === person.id}><Eye size={14} /> Publicar</button> : null}
                {person.status !== 'hidden' ? <button onClick={() => act('birthday', person.id, 'hide')} disabled={busyId === person.id}><EyeOff size={14} /> Ocultar</button> : null}
                <button onClick={() => editBirthday(person)} disabled={busyId === person.id}><Pencil size={14} /> Editar</button>
                <button className="is-danger" onClick={() => remove('birthday', person.id)} disabled={busyId === person.id}><Trash2 size={14} /> Excluir</button>
              </div>
            </article>
          )) : <p>Nenhum aniversário cadastrado.</p>}
        </div>
      </section>

      <section className="community-admin-panel">
        <div className="community-admin-panel__title">
          <MessageCircle size={18} />
          <div>
            <h2>Mural de Recados</h2>
            <p>{data.wall.length} recados carregados</p>
          </div>
        </div>

        <div className="community-admin-list">
          {loading ? <p>Carregando...</p> : data.wall.length ? data.wall.map((post) => (
            <article key={post.id}>
              <div>
                <strong>{post.authorName}</strong>
                <span>{statusLabel(post.status)}</span>
                <p>{post.body}</p>
              </div>
              <div className="community-admin-actions">
                {post.status === 'hidden' ? <button onClick={() => act('wall', post.id, 'publish')} disabled={busyId === post.id}><Eye size={14} /> Publicar</button> : <button onClick={() => act('wall', post.id, 'hide')} disabled={busyId === post.id}><EyeOff size={14} /> Ocultar</button>}
                <button onClick={() => editWall(post)} disabled={busyId === post.id}><Pencil size={14} /> Editar</button>
                <button className="is-danger" onClick={() => remove('wall', post.id)} disabled={busyId === post.id}><Trash2 size={14} /> Excluir</button>
              </div>
            </article>
          )) : <p>Nenhum recado cadastrado.</p>}
        </div>
      </section>
    </main>
  )
}
