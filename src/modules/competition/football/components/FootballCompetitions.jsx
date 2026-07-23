import { ArrowUpDown, Globe2, Heart, Layers3, Target, Trophy, Users } from 'lucide-react'
import { Badge, Card } from '../../../../design-system'
import { getUtcTimestamp, isFinishedStatus } from '../../../../core/time'
import { FOOTBALL_WORLD_CUP_STAGES } from '../constants/footballCenterConstants'
import {
  getFootballStageLabel,
  getFootballUpcomingMatches,
  getFootballWorldCupStageIndex,
  isFootballWorldCupMatch,
} from '../utils/footballCenterUtils'
import { FootballEmptyState, FootballPanel } from './FootballCommon'
import { FootballMatchCard } from './FootballMatchCard'

export function FootballWorldCup({ data, onOpen }) {
  const matches = (data.matches || []).filter(isFootballWorldCupMatch)
  if (!matches.length) return null

  const upcoming = getFootballUpcomingMatches(matches)
  const knockout = (data.knockout || []).filter(isFootballWorldCupMatch)
  const groups = Object.entries(data.groups || {})
    .map(([name, groupMatches]) => [name, groupMatches.filter(isFootballWorldCupMatch)])
    .filter(([, groupMatches]) => groupMatches.length)
  const reference = [...matches].sort((left, right) => getFootballWorldCupStageIndex(right.stage || right.round?.name) - getFootballWorldCupStageIndex(left.stage || left.round?.name))[0]
  const currentStage = getFootballStageLabel(reference?.stage || reference?.round?.name || 'Grupos')
  const stageIndex = getFootballWorldCupStageIndex(reference?.stage || reference?.round?.name)
  const progress = Math.round(((stageIndex + 1) / FOOTBALL_WORLD_CUP_STAGES.length) * 100)

  return (
    <FootballPanel title="Copa do Mundo" eyebrow="Caminho ate a final" icon={Globe2}>
      <div className="rounded-[var(--bds-radius-sm)] border-y border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_42%,transparent)] p-[var(--bds-space-12)] shadow-none">
        <div className="flex flex-wrap items-end justify-between gap-[var(--bds-space-16)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">Fase atual</p>
          <h3 className="mt-[var(--bds-space-4)] text-xl font-black text-[var(--bds-color-text)]">{currentStage}</h3>
          </div>
          <strong className="text-sm text-[var(--bds-color-primary-hover)]">{progress}% da jornada</strong>
        </div>
        <div className="mt-[var(--bds-space-16)] h-2 overflow-hidden rounded-full bg-[var(--bds-color-surface)]">
          <div className="h-full rounded-full bg-[var(--bds-color-primary-hover)] transition-[width] duration-[var(--bds-transition-slow)]" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-[var(--bds-space-12)] grid grid-cols-3 gap-[var(--bds-space-6)] lg:grid-cols-6" role="list" aria-label="Timeline da Copa do Mundo">
          {FOOTBALL_WORLD_CUP_STAGES.map((stage, index) => (
            <div
              key={stage}
              role="listitem"
              aria-current={index === stageIndex ? 'step' : undefined}
              className={`relative rounded-[var(--bds-radius-sm)] border px-[var(--bds-space-6)] py-[var(--bds-space-5)] text-center text-[var(--bds-font-micro)] font-black ${index <= stageIndex ? 'border-[var(--bds-color-primary-hover)] bg-[color-mix(in_srgb,var(--bds-color-primary)_72%,transparent)] text-[var(--bds-color-text)]' : 'border-[color-mix(in_srgb,var(--bds-color-border)_72%,transparent)] text-[var(--bds-color-text-muted)]'}`}
            >
              {stage}
              {index === stageIndex ? <span className="sr-only"> - fase atual</span> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[var(--bds-space-12)] grid gap-[var(--bds-space-12)] xl:grid-cols-2">
        {groups.length ? (
          <div>
            <h3 className="mb-[var(--bds-space-10)] flex items-center gap-[var(--bds-space-8)] font-black text-[var(--bds-color-text)]"><Users size={17} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" /> Grupos</h3>
            <div className="grid gap-[var(--bds-space-8)] sm:grid-cols-2">
              {groups.slice(0, 8).map(([name, groupMatches]) => (
                <div key={name} className="rounded-[var(--bds-radius-md)] bg-[color-mix(in_srgb,var(--bds-color-background)_74%,transparent)] p-[var(--bds-space-10)]">
                  <strong className="text-sm text-[var(--bds-color-text)]">{name}</strong>
                  <p className="mt-[var(--bds-space-4)] text-xs text-[var(--bds-color-text-secondary)]">{groupMatches.length} confrontos</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="mb-[var(--bds-space-10)] flex items-center gap-[var(--bds-space-8)] font-black text-[var(--bds-color-text)]"><Layers3 size={17} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" /> Proxima rodada</h3>
          {upcoming.length ? (
            <div className="grid gap-[var(--bds-space-8)]">{upcoming.slice(0, 4).map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} compact />)}</div>
          ) : (
            <FootballEmptyState compact title="Confrontos a definir" description="A proxima rodada aparecera assim que estiver nos dados sincronizados." />
          )}
        </div>
      </div>

      {knockout.length ? (
        <div className="mt-[var(--bds-space-12)] rounded-[var(--bds-radius-sm)] bg-[color-mix(in_srgb,var(--bds-color-background)_36%,transparent)] p-[var(--bds-space-10)]">
          <h3 className="mb-[var(--bds-space-16)] flex items-center gap-[var(--bds-space-8)] font-black text-[var(--bds-color-text)]"><Target size={17} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" /> Chaveamento simplificado</h3>
          <div className="flex gap-[var(--bds-space-16)] overflow-x-auto pb-[var(--bds-space-8)]">
            {knockout.slice(0, 8).map((match) => <div key={match.id} className="min-w-72 flex-1"><FootballMatchCard match={match} onOpen={onOpen} compact /></div>)}
          </div>
        </div>
      ) : null}
    </FootballPanel>
  )
}

function FootballCompetitionCard({ competition, favorited, selected, onFavorite, onSelect, matches }) {
  const competitionMatches = matches.filter((match) => match.competitionId === competition.id)
  const finished = competitionMatches.filter((match) => isFinishedStatus(match.status)).length
  const progress = competitionMatches.length ? Math.round((finished / competitionMatches.length) * 100) : 0
  const round = competitionMatches.find((match) => match.round?.name)?.round?.name || competitionMatches.find((match) => match.stage)?.stage || 'Temporada ativa'

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`group flex min-h-24 cursor-pointer flex-col rounded-[var(--bds-radius-sm)] border bg-[color-mix(in_srgb,var(--bds-color-surface)_34%,transparent)] p-[var(--bds-space-10)] shadow-none transition duration-[var(--bds-transition-fast)] hover:border-[var(--bds-color-primary-hover)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_12%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${selected ? 'border-[var(--bds-color-primary-hover)] shadow-[inset_0_2px_0_var(--bds-color-primary-hover)]' : 'border-[color-mix(in_srgb,var(--bds-color-border)_62%,transparent)]'}`}
    >
      <div className="flex items-start gap-[var(--bds-space-12)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center drop-shadow-sm">
          {competition.logo ? <img src={competition.logo} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Trophy size={20} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-black text-[var(--bds-color-text)]">{competition.name}</h3>
          <p className="mt-[var(--bds-space-4)] truncate text-xs text-[var(--bds-color-text-secondary)]">{round}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onFavorite()
          }}
          aria-pressed={favorited}
          aria-label={favorited ? `Remover ${competition.name} dos favoritos` : `Favoritar ${competition.name}`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${favorited ? 'border-[var(--bds-color-primary-hover)] bg-[var(--bds-color-primary)] text-[var(--bds-color-text)]' : 'border-[var(--bds-color-border)] text-[var(--bds-color-text-secondary)] hover:border-[var(--bds-color-primary-hover)] hover:text-[var(--bds-color-primary-hover)]'}`}
        >
          <Heart size={16} fill={favorited ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-auto flex items-center justify-between pt-[var(--bds-space-10)] text-xs">
        <span className="font-bold text-[var(--bds-color-text)]">{competition.matches} jogos</span>
        <span className="text-[var(--bds-color-text-secondary)]">{finished} concluidos</span>
      </div>
      <div className="mt-[var(--bds-space-6)] h-1.5 overflow-hidden rounded-full bg-[var(--bds-color-background)]">
        <div className="h-full rounded-full bg-[var(--bds-color-primary-hover)]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-[var(--bds-space-8)] flex items-center justify-between">
        <Badge className="border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-[var(--bds-color-text-secondary)]">{selected ? 'Selecionada' : progress === 100 ? 'Concluida' : 'Em disputa'}</Badge>
        <span className="text-xs font-black text-[var(--bds-color-primary-hover)]">{progress}%</span>
      </div>
    </Card>
  )
}

export function FootballCompetitionGrid({ competitions, favoriteKeys, activeCompetition, onSelect, onFavorite, matches, sortBy, onSort }) {
  const sortedCompetitions = [...competitions].sort((left, right) => {
    if (sortBy === 'matches') return Number(right.matches || 0) - Number(left.matches || 0) || left.name.localeCompare(right.name, 'pt-BR')
    if (sortBy === 'recent') {
      const latest = (competition) => Math.max(0, ...matches.filter((match) => match.competitionId === competition.id).map((match) => getUtcTimestamp(match.startsAt)))
      return latest(right) - latest(left) || left.name.localeCompare(right.name, 'pt-BR')
    }
    return left.name.localeCompare(right.name, 'pt-BR')
  })

  return (
    <FootballPanel
      title="Competicoes"
      eyebrow="Torneios monitorados"
      icon={Trophy}
      action={(
        <label className="flex items-center gap-[var(--bds-space-8)] text-xs font-black uppercase text-[var(--bds-color-text-secondary)]">
          <ArrowUpDown size={15} aria-hidden="true" />
          <span className="sr-only">Ordenar competicoes</span>
          <select value={sortBy} onChange={(event) => onSort(event.target.value)} aria-label="Ordenar competicoes" className="rounded-[var(--bds-radius-sm)] border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] px-[var(--bds-space-16)] py-[var(--bds-space-8)] text-xs font-bold text-[var(--bds-color-text)] outline-none focus:border-[var(--bds-color-primary-hover)]">
            <option value="alphabetical">Alfabetica</option>
            <option value="matches">Quantidade de jogos</option>
            <option value="recent">Mais recentes</option>
          </select>
        </label>
      )}
    >
      {sortedCompetitions.length ? (
        <div className="grid gap-[var(--bds-space-8)] md:grid-cols-2 2xl:grid-cols-3">
          {sortedCompetitions.map((competition) => {
            const competitionKey = competition.code || competition.id
            return (
              <FootballCompetitionCard
                key={competition.id}
                competition={competition}
                matches={matches}
                selected={activeCompetition === competitionKey}
                favorited={favoriteKeys.has(`competition:${competition.id}`)}
                onSelect={() => onSelect(competitionKey)}
                onFavorite={() => onFavorite(competition)}
              />
            )
          })}
        </div>
      ) : (
        <FootballEmptyState title="Nenhuma competicao sincronizada" description="Os torneios serao organizados aqui a partir das partidas ja carregadas." />
      )}
    </FootballPanel>
  )
}
