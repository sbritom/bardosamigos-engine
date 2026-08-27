import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Radio, Settings, Shield, Sparkles, Star, Trophy, Tv, UserRound } from "lucide-react"
import { Avatar, FeatureCard, HeroCard, StatusBadge, classNames } from "../../../design-system"
import { getUtcTimestamp, isFinishedStatus, isLiveStatus, nowUtcIso } from "../../../core/time"
import { listFootballCenterData } from "../../competition/services/footballCenterService"
import "../styles/personalization.css"

const statusLabels = {
  live: "AO VIVO",
  upcoming: "Agendado",
  finished: "Finalizado",
}

function formatDateTime(value) {
  if (!value) return ""
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function getMatchScore(match) {
  const homeScore = match?.homeScore
  const awayScore = match?.awayScore
  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) return "VS"
  return `${homeScore} x ${awayScore}`
}

function getTeamMap(teams = []) {
  const map = new Map()
  teams.forEach((team) => {
    ;[team.name, team.shortName, team.tla].filter(Boolean).forEach((name) => {
      map.set(String(name).toLowerCase(), team)
    })
  })
  return map
}

function getFavoriteKeys(favorites = []) {
  return new Set(
    favorites
      .map((favorite) => {
        const type = favorite.favoriteType || favorite.type
        const id = favorite.favoriteId
        return type && id ? `${type}:${id}` : null
      })
      .filter(Boolean),
  )
}

function isFavoriteMatch(match, favoriteKeys, teamsByName) {
  if (!favoriteKeys.size) return false
  const homeTeam = teamsByName.get(String(match.homeTeam || "").toLowerCase())
  const awayTeam = teamsByName.get(String(match.awayTeam || "").toLowerCase())

  return (
    favoriteKeys.has(`match:${match.id}`) ||
    favoriteKeys.has(`competition:${match.competitionId}`) ||
    favoriteKeys.has(`team:${homeTeam?.id}`) ||
    favoriteKeys.has(`team:${awayTeam?.id}`)
  )
}

function pickFavoriteMatches(matches = [], favorites = [], teams = []) {
  const favoriteKeys = getFavoriteKeys(favorites)
  const teamsByName = getTeamMap(teams)
  return matches.filter((match) => isFavoriteMatch(match, favoriteKeys, teamsByName))
}

export function PersonalizationShell({ eyebrow, title, description, icon, actions, children }) {
  return (
    <main className="bds-personalization-page">
      <HeroCard
        className="bds-personalization-hero"
        eyebrow={eyebrow}
        title={title}
        subtitle={description}
        action={actions}
        media={<div className="bds-personalization-hero__icon">{icon}</div>}
      />
      {children}
    </main>
  )
}

export function ProfileSummary({ profile }) {
  return (
    <FeatureCard
      className="bds-personalization-profile"
      icon={<UserRound size={18} />}
      eyebrow="Area do perfil"
      title="Perfil"
      description="Base preparada para personalizar sua experiencia."
    >
      <div className="bds-personalization-profile__content">
        <Avatar fallback={profile.avatarFallback} alt={profile.name} size="lg" />
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.nickname}</p>
          {profile.joinedAt && (
            <span className="bds-personalization-muted">
              Entrada em {formatDateTime(profile.joinedAt)}
            </span>
          )}
          <p className="bds-personalization-profile__summary">{profile.summary}</p>
        </div>
      </div>
    </FeatureCard>
  )
}

export function FavoriteToggle({ item, selected, onToggle, icon }) {
  return (
    <button
      type="button"
      className={classNames("bds-favorite-toggle", selected && "bds-favorite-toggle--selected")}
      aria-pressed={selected}
      onClick={() => onToggle(item.id)}
    >
      <span className="bds-favorite-toggle__icon">{icon || <Star size={15} />}</span>
      <span>
        <strong>{item.label}</strong>
        {item.meta && <small>{item.meta}</small>}
      </span>
    </button>
  )
}

export function PreferencePanel({ sections, footballOptions }) {
  const [selected, setSelected] = useState({})
  const [dynamicOptions, setDynamicOptions] = useState(footballOptions || { team: [], competition: [] })

  useEffect(() => {
    let active = true

    async function loadOptions() {
      const result = await listFootballCenterData()
      if (!active || result.error) return

      const teams = (result.data?.teams || []).map((team) => ({
        id: team.id,
        label: team.shortName || team.name,
        meta: team.tla || team.name,
      }))

      const competitions = (result.data?.competitions || []).map((competition) => ({
        id: competition.id,
        label: competition.name,
        meta: competition.country || competition.type,
      }))

      setDynamicOptions({ team: teams, competition: competitions })
    }

    loadOptions()

    return () => {
      active = false
    }
  }, [])

  function toggle(sectionId, itemId) {
    setSelected((current) => ({
      ...current,
      [sectionId]: current[sectionId] === itemId ? "" : itemId,
    }))
  }

  return (
    <section className="bds-personalization-grid bds-personalization-grid--preferences">
      {sections.map((section) => {
        const options = section.options || dynamicOptions[section.type] || []
        return (
          <FeatureCard
            key={section.id}
            className="bds-personalization-card"
            icon={section.type === "tv" ? <Tv size={18} /> : section.type === "radio" ? <Radio size={18} /> : <Trophy size={18} />}
            title={section.title}
            description={section.description}
            action={<StatusBadge status="Preparado" tone="info" />}
          >
            <div className="bds-favorite-list">
              {options.length ? (
                options.slice(0, 8).map((item) => (
                  <FavoriteToggle
                    key={item.id}
                    item={item}
                    selected={selected[section.id] === item.id}
                    onToggle={(id) => toggle(section.id, id)}
                  />
                ))
              ) : (
                <p className="bds-personalization-empty">Dados reais serao exibidos quando houver favoritos disponiveis.</p>
              )}
            </div>
          </FeatureCard>
        )
      })}
    </section>
  )
}

function MatchRow({ match, type }) {
  return (
    <div className="bds-my-football-row">
      <div className="bds-my-football-row__teams">
        <strong>{match.homeTeam}</strong>
        <span>{match.awayTeam}</span>
      </div>
      <div className="bds-my-football-row__score">{type === "upcoming" ? formatDateTime(match.startsAt) : getMatchScore(match)}</div>
      <StatusBadge status={statusLabels[type] || match.status} />
    </div>
  )
}

export function MyFootballPanel() {
  const [state, setState] = useState({ loading: true, error: "", data: null })

  useEffect(() => {
    let active = true

    async function loadFootball() {
      const result = await listFootballCenterData()
      if (!active) return

      if (result.error) {
        setState({ loading: false, error: result.error.message || "Nao foi possivel carregar seu futebol.", data: null })
        return
      }

      setState({ loading: false, error: "", data: result.data })
    }

    loadFootball()

    return () => {
      active = false
    }
  }, [])

  const groups = useMemo(() => {
    const matches = pickFavoriteMatches(state.data?.matches || [], state.data?.favorites || [], state.data?.teams || [])
    const now = getUtcTimestamp(nowUtcIso())

    return {
      live: matches.filter((match) => isLiveStatus(match.status)).slice(0, 3),
      upcoming: matches
        .filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status) && getUtcTimestamp(match.startsAt) >= now)
        .sort((left, right) => getUtcTimestamp(left.startsAt) - getUtcTimestamp(right.startsAt))
        .slice(0, 3),
      finished: matches
        .filter((match) => isFinishedStatus(match.status))
        .sort((left, right) => getUtcTimestamp(right.startsAt) - getUtcTimestamp(left.startsAt))
        .slice(0, 3),
    }
  }, [state.data])

  return (
    <FeatureCard
      className="bds-personalization-card bds-my-football"
      icon={<Trophy size={18} />}
      title="Meu Futebol"
      description="Partidas reais vinculadas aos seus favoritos."
    >
      {state.loading && <p className="bds-personalization-empty">Carregando partidas...</p>}
      {state.error && <p className="bds-personalization-empty">{state.error}</p>}
      {!state.loading && !state.error && (
        <div className="bds-my-football__sections">
          {[
            ["live", "Partidas ao vivo"],
            ["upcoming", "Proximos jogos"],
            ["finished", "Resultados recentes"],
          ].map(([key, label]) => (
            <div key={key} className="bds-my-football__section">
              <h3>{label}</h3>
              {groups[key].length ? (
                groups[key].map((match) => <MatchRow key={match.id} match={match} type={key} />)
              ) : (
                <p className="bds-personalization-empty">Nenhuma partida encontrada.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </FeatureCard>
  )
}

export function ForYouPreview({ sections }) {
  return (
    <section className="bds-personalization-grid">
      {sections.map((section) => (
        <FeatureCard
          key={section.id}
          className="bds-personalization-card"
          icon={<Sparkles size={18} />}
          title={section.title}
          description={section.description}
          action={<StatusBadge status="Estrutura" tone="info" />}
        />
      ))}
    </section>
  )
}

export function SettingsPanel({ sections }) {
  return (
    <section className="bds-personalization-grid">
      {sections.map((section) => (
        <FeatureCard
          key={section.id}
          className="bds-personalization-card"
          icon={section.id === "notifications" ? <Shield size={18} /> : <Settings size={18} />}
          title={section.title}
          description={section.description}
        >
          <div className="bds-settings-options">
            {section.options.map((option) => (
              <span key={option}>{option}</span>
            ))}
          </div>
        </FeatureCard>
      ))}
    </section>
  )
}

export function PreferenceIntro() {
  return (
    <FeatureCard
      className="bds-personalization-card"
      icon={<CalendarDays size={18} />}
      title="Persistencia futura"
      description="As selecoes ja ficam isoladas na interface para serem conectadas ao perfil real."
    />
  )
}
