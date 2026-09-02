import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, LogIn, Newspaper, Radio, Settings, Sparkles, Star, Trophy, Tv, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ActionButton } from '../../../design-system'
import { useAuth } from '../../auth/AuthContext'
import { PersonalizationShell } from '../components/PersonalizationComponents'
import { loadPersonalFavorites } from '../services/favoritesService'

const QUICK_LINKS = [
  { id: 'football', title: 'Futebol', description: 'Jogos, times e competicoes.', path: '/football', icon: Trophy },
  { id: 'tv', title: 'TV', description: 'Assista aos canais e salve seus favoritos.', path: '/tv', icon: Tv },
  { id: 'radio', title: 'Radio', description: 'Ouça a programacao e peça sua musica.', path: '/radio', icon: Radio },
  { id: 'news', title: 'Noticias', description: 'Veja as noticias em destaque.', path: '/news', icon: Newspaper },
  { id: 'events', title: 'Eventos', description: 'Acompanhe a agenda do IMORTAL0800.', path: '/events', icon: CalendarDays },
]

function GuestForYou({ onLogin, onExplore }) {
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-3xl border border-white/10 bg-[var(--surface)] p-7 shadow-xl md:p-8">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Acesso livre</span>
        <h2 className="mt-2 text-3xl font-black text-[var(--text)]">O portal continua aberto para todos</h2>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--text-secondary)]">
          Voce pode usar Radio, TV, Futebol, Noticias e Eventos sem cadastro. A conta serve apenas para guardar favoritos e preferencias pessoais.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110"
          >
            <LogIn size={18} />
            Entrar para ver meus favoritos
          </button>
          <button
            type="button"
            onClick={onExplore}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-[var(--text)] transition hover:bg-white/10"
          >
            Continuar explorando
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
        <Star className="text-[var(--primary)]" size={26} />
        <h3 className="mt-3 text-xl font-black text-[var(--text)]">O que fica salvo?</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Canais da TV, times do Futebol e suas preferencias passam a acompanhar sua conta em qualquer dispositivo.
        </p>
      </div>
    </section>
  )
}

function FavoriteCard({ title, subtitle, image, onOpen, icon: Icon = Star }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-24 items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[var(--primary)]/40 hover:bg-white/10"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/10 text-[var(--primary)]">
        {image ? <img src={image} alt="" className="h-full w-full object-contain p-1" /> : <Icon size={24} />}
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[var(--text)]">{title}</strong>
        <small className="mt-1 block truncate text-[var(--text-secondary)]">{subtitle}</small>
      </span>
    </button>
  )
}

function QuickLinks({ interests, onlyInterests, onOpen }) {
  const visibleLinks = onlyInterests
    ? QUICK_LINKS.filter((link) => interests.includes(link.id))
    : [...QUICK_LINKS].sort((left, right) => {
      const leftSelected = interests.includes(left.id) ? 0 : 1
      const rightSelected = interests.includes(right.id) ? 0 : 1
      return leftSelected - rightSelected
    })

  return (
    <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">Seus interesses</span>
      <h2 className="mt-1 text-xl font-black text-[var(--text)]">Atalhos para voce</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleLinks.map(({ id, title, description, path, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpen(path)}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[var(--primary)]/40 hover:bg-white/10"
          >
            <Icon size={20} className="text-[var(--primary)]" />
            <strong className="mt-3 block text-[var(--text)]">{title}</strong>
            <small className="mt-1 block leading-5 text-[var(--text-secondary)]">{description}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function ForYouPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, profileLoading, preferences, openAuth } = useAuth()
  const [favorites, setFavorites] = useState({ football: [], tv: [], errors: [] })
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  useEffect(() => {
    let active = true

    if (!user?.id) {
      setFavorites({ football: [], tv: [], errors: [] })
      setLoadingFavorites(false)
      return undefined
    }

    setLoadingFavorites(true)
    loadPersonalFavorites(user.id)
      .then((result) => {
        if (active) setFavorites(result)
      })
      .catch((error) => {
        if (active) setFavorites({ football: [], tv: [], errors: [error] })
      })
      .finally(() => {
        if (active) setLoadingFavorites(false)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  const personalization = preferences?.personalization || {}
  const interests = useMemo(() => {
    const saved = Array.isArray(personalization.interests) ? personalization.interests : []
    return saved.length ? saved : QUICK_LINKS.map((link) => link.id)
  }, [personalization.interests])
  const favoritesFirst = personalization.favoritesFirst !== false
  const onlyInterests = Boolean(personalization.onlyInterests)

  const tvFavorites = favorites.tv
    .map((item) => item?.channel)
    .filter(Boolean)
  const footballFavorites = favorites.football
  const hasFavorites = tvFavorites.length > 0 || footballFavorites.length > 0

  const favoritesSection = (
    <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">Favoritos</span>
          <h2 className="mt-1 text-xl font-black text-[var(--text)]">O que voce salvou</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">
          {tvFavorites.length + footballFavorites.length} item(ns)
        </span>
      </div>

      {loadingFavorites || profileLoading ? (
        <p className="mt-5 text-sm text-[var(--text-secondary)]">Carregando seus favoritos...</p>
      ) : hasFavorites ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {footballFavorites.map((favorite) => (
            <FavoriteCard
              key={`football-${favorite.id}`}
              title={favorite.metadata?.name || (favorite.type === 'team' ? 'Time favorito' : 'Competicao favorita')}
              subtitle={favorite.type === 'team' ? (favorite.metadata?.country || 'Futebol') : 'Competicao'}
              image={favorite.metadata?.crest || ''}
              icon={Trophy}
              onOpen={() => navigate(favorite.type === 'team' ? `/football/times/${favorite.favoriteId}` : '/football')}
            />
          ))}
          {tvFavorites.map((channel) => (
            <FavoriteCard
              key={`tv-${channel.id}`}
              title={channel.name || 'Canal favorito'}
              subtitle={channel.category?.name || channel.language || 'TV'}
              image={channel.logo || ''}
              icon={Tv}
              onOpen={() => navigate('/tv')}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5">
          <p className="font-bold text-[var(--text)]">Voce ainda nao salvou favoritos.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Use a estrela na TV ou favorite um time na area de Futebol.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/tv')} className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white">Explorar TV</button>
            <button type="button" onClick={() => navigate('/football')} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-[var(--text)]">Explorar Futebol</button>
          </div>
        </div>
      )}

      {favorites.errors.length > 0 && (
        <p className="mt-4 text-sm text-amber-100">Alguns favoritos nao puderam ser carregados agora.</p>
      )}
    </section>
  )

  const quickLinksSection = <QuickLinks interests={interests} onlyInterests={onlyInterests} onOpen={navigate} />

  return (
    <PersonalizationShell
      eyebrow="Para voce"
      title="Sua area personalizada"
      description="Favoritos e atalhos organizados a partir das escolhas salvas na sua conta."
      icon={<Sparkles size={40} />}
      actions={
        <>
          <ActionButton variant="secondary" icon={<UserRound size={16} />} onClick={() => navigate('/profile')}>
            Perfil
          </ActionButton>
          <ActionButton variant="outline" icon={<Settings size={16} />} onClick={() => navigate('/settings')}>
            Preferencias
          </ActionButton>
        </>
      }
    >
      {!isAuthenticated ? (
        <GuestForYou
          onLogin={() => openAuth('Entre para ver favoritos e preferencias salvos na sua conta.', 'login')}
          onExplore={() => navigate('/')}
        />
      ) : (
        <div className="mx-auto grid w-full max-w-5xl gap-5">
          {favoritesFirst ? favoritesSection : quickLinksSection}
          {favoritesFirst ? quickLinksSection : favoritesSection}
        </div>
      )}
    </PersonalizationShell>
  )
}
