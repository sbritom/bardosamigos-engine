import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, Check, LogIn, Newspaper, Radio, Save, Settings, Star, Trophy, Tv, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ActionButton } from '../../../design-system'
import { useAuth } from '../../auth/AuthContext'
import { PersonalizationShell } from '../components/PersonalizationComponents'

const INTERESTS = [
  { id: 'football', label: 'Futebol', description: 'Jogos, times e competicoes.', icon: Trophy },
  { id: 'tv', label: 'TV', description: 'Canais e destaques da TV do portal.', icon: Tv },
  { id: 'radio', label: 'Radio', description: 'Programacao e conteudos da radio.', icon: Radio },
  { id: 'news', label: 'Noticias', description: 'Noticias e assuntos em destaque.', icon: Newspaper },
  { id: 'events', label: 'Eventos', description: 'Eventos e programação do IMORTAL0800.', icon: CalendarDays },
]

const DEFAULT_INTERESTS = INTERESTS.map((item) => item.id)

function GuestSettings({ onLogin }) {
  return (
    <section className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-[var(--surface)] p-7 shadow-xl">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Preferencias pessoais</span>
      <h2 className="mt-2 text-2xl font-black text-[var(--text)]">Entre para salvar suas preferencias</h2>
      <p className="mt-3 max-w-2xl leading-7 text-[var(--text-secondary)]">
        O portal continua livre sem cadastro. A conta e necessaria somente para guardar suas escolhas e usa-las em experiencias personalizadas.
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="mt-6 flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110"
      >
        <LogIn size={18} />
        Entrar para personalizar
      </button>
    </section>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, profileLoading, preferences, openAuth, updatePreferences } = useAuth()
  const savedPersonalization = preferences?.personalization || {}
  const savedInterests = Array.isArray(savedPersonalization.interests) && savedPersonalization.interests.length
    ? savedPersonalization.interests
    : DEFAULT_INTERESTS

  const [interests, setInterests] = useState(savedInterests)
  const [favoritesFirst, setFavoritesFirst] = useState(savedPersonalization.favoritesFirst !== false)
  const [onlyInterests, setOnlyInterests] = useState(Boolean(savedPersonalization.onlyInterests))
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [tone, setTone] = useState('success')

  useEffect(() => {
    setInterests(savedInterests)
    setFavoritesFirst(savedPersonalization.favoritesFirst !== false)
    setOnlyInterests(Boolean(savedPersonalization.onlyInterests))
  }, [preferences])

  const selectedCount = interests.length
  const hasAtLeastOneInterest = selectedCount > 0
  const interestSet = useMemo(() => new Set(interests), [interests])

  function toggleInterest(id) {
    setFeedback('')
    setInterests((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id])
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!hasAtLeastOneInterest) {
      setTone('error')
      setFeedback('Escolha pelo menos um interesse para personalizar a area Para voce.')
      return
    }

    setBusy(true)
    setFeedback('')

    try {
      await updatePreferences({
        personalization: {
          interests,
          favoritesFirst,
          onlyInterests,
        },
      })
      setTone('success')
      setFeedback('Preferencias salvas. A area Para voce ja usa essas escolhas.')
    } catch (error) {
      setTone('error')
      setFeedback(error.message || 'Nao foi possivel salvar suas preferencias.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PersonalizationShell
      eyebrow="Configuracoes"
      title="Preferencias da conta"
      description="Escolha os assuntos que quer priorizar e como a area Para voce deve organizar seus conteudos."
      icon={<Settings size={40} />}
      actions={
        <ActionButton variant="secondary" icon={<UserRound size={16} />} onClick={() => navigate('/profile')}>
          Voltar ao perfil
        </ActionButton>
      }
    >
      {!isAuthenticated ? (
        <GuestSettings onLogin={() => openAuth('Entre para salvar suas preferencias no IMORTAL0800.', 'login')} />
      ) : (
        <form className="mx-auto grid w-full max-w-5xl gap-5" onSubmit={handleSave}>
          <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">Seus interesses</span>
                <h2 className="mt-1 text-2xl font-black text-[var(--text)]">O que voce quer ver mais?</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Essas escolhas organizam os atalhos e destaques da sua area personalizada.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">
                {selectedCount} selecionado{selectedCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {INTERESTS.map(({ id, label, description, icon: Icon }) => {
                const selected = interestSet.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleInterest(id)}
                    aria-pressed={selected}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-[var(--primary)] text-white' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
                      {selected ? <Check size={18} /> : <Icon size={18} />}
                    </span>
                    <span>
                      <strong className="block text-[var(--text)]">{label}</strong>
                      <small className="mt-1 block leading-5 text-[var(--text-secondary)]">{description}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
              <input
                type="checkbox"
                checked={favoritesFirst}
                onChange={(event) => setFavoritesFirst(event.target.checked)}
                className="mt-1 h-5 w-5 accent-[var(--primary)]"
              />
              <span>
                <span className="flex items-center gap-2 font-black text-[var(--text)]"><Star size={18} /> Priorizar meus favoritos</span>
                <small className="mt-2 block leading-6 text-[var(--text-secondary)]">Mostra canais e times salvos antes dos atalhos gerais na area Para voce.</small>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
              <input
                type="checkbox"
                checked={onlyInterests}
                onChange={(event) => setOnlyInterests(event.target.checked)}
                className="mt-1 h-5 w-5 accent-[var(--primary)]"
              />
              <span>
                <span className="flex items-center gap-2 font-black text-[var(--text)]"><Bell size={18} /> Mostrar so meus interesses</span>
                <small className="mt-2 block leading-6 text-[var(--text-secondary)]">Oculta atalhos de areas que voce nao marcou como interesse.</small>
              </span>
            </label>
          </section>

          {feedback && (
            <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${tone === 'success' ? 'bg-emerald-500/15 text-emerald-100' : 'bg-red-500/15 text-red-100'}`}>
              {feedback}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || profileLoading}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <Save size={18} />
              {busy ? 'Salvando...' : 'Salvar preferencias'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-you')}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-[var(--text)] transition hover:bg-white/10"
            >
              Ver minha area Para voce
            </button>
          </div>
        </form>
      )}
    </PersonalizationShell>
  )
}
