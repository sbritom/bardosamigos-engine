import { Activity, CheckCircle2, Clock3, Radio, Users } from 'lucide-react'
import { isFinishedStatus, isLiveStatus, nowUtcIso } from '../../../../core/time'
import { FootballCompetitionHero } from '../components/FootballCompetitionHero'
import { FootballEmptyState, FootballPanel } from '../components/FootballCommon'
import { FootballFilterBar } from '../components/FootballFilterBar'
import { FootballSummaryCards } from '../components/FootballHero'
import { FootballBreadcrumb, FootballExperienceBar } from '../components/FootballNavigation'
import { FootballRightPanel } from '../components/FootballRightPanel'
import { FootballSection } from '../components/FootballSection'
import { FootballDrawer, FootballSidebar } from '../components/FootballSidebar'
import { FOOTBALL_COMPETITION_FILTERS, FOOTBALL_FOCUSED_VIEWS } from '../constants/footballCenterConstants'
import { footballMatchBelongsToCompetition, getFootballUpcomingMatches, isFootballFavoriteMatch } from '../utils/footballCenterUtils'

export default function FootballCompetitionPage({
  config,
  data,
  derived,
  favoriteKeys,
  activeFilter,
  drawerOpen,
  searchTerm,
  onFilter,
  onDrawerOpen,
  onDrawerClose,
  onSearch,
  onClearSearch,
  onClearFilters,
  onSelectCompetition,
  onHome,
  onFootball,
  onOpenMatch,
  onFavoriteMatch,
}) {
  const competitionMatches = (data.matches || []).filter((match) => footballMatchBelongsToCompetition(match, config))
  const matchCompetitionId = competitionMatches.find((match) => match.competitionId)?.competitionId
  const competition = (data.competitions || []).find((item) => item.id === matchCompetitionId || config.codes.includes(String(item.code || '').toLocaleLowerCase('pt-BR')))
  const teamNames = new Set(competitionMatches.flatMap((match) => [match.homeTeam, match.awayTeam]).filter(Boolean))
  const competitionTeams = (data.teams || []).filter((team) => teamNames.has(team.name))
  const teamCount = teamNames.size
  const liveCount = competitionMatches.filter((match) => isLiveStatus(match.status)).length
  const finishedCount = competitionMatches.filter((match) => isFinishedStatus(match.status)).length
  const upcomingCount = getFootballUpcomingMatches(competitionMatches, nowUtcIso()).length
  const favoriteMatches = competitionMatches.filter((match) => isFootballFavoriteMatch(match, favoriteKeys)).length
  const focusedView = FOOTBALL_FOCUSED_VIEWS[activeFilter]
  const summaryCards = [
    { id: 'all', label: 'Jogos', value: competitionMatches.length, description: 'partidas da competição', icon: Activity },
    { id: 'live', label: 'Ao Vivo', value: liveCount, description: 'partidas em andamento', icon: Radio },
    { id: 'results', label: 'Finalizados', value: finishedCount, description: 'placares confirmados', icon: CheckCircle2 },
    { id: 'upcoming', label: 'Agendados', value: upcomingCount, description: 'próximos confrontos', icon: Clock3 },
    { id: 'all', label: 'Times', value: teamCount, description: 'equipes participantes', icon: Users },
  ]
  const sideStats = [
    { label: 'Jogos', value: competitionMatches.length },
    { label: 'Times', value: teamCount },
    { label: 'Ao vivo', value: liveCount },
    { label: 'Finalizados', value: finishedCount },
    { label: 'Próximos', value: upcomingCount },
    { label: 'Favoritos', value: favoriteMatches },
  ]
  const sidebarProps = {
    matches: data.matches || [],
    activeCompetition: config.id,
    favoriteCount: favoriteKeys.size,
    onSelect: onSelectCompetition,
  }

  return (
    <section className="space-y-[var(--bds-space-32)]">
      <FootballDrawer open={drawerOpen} onClose={onDrawerClose} {...sidebarProps} />
      <FootballBreadcrumb activeCompetition={config.id} onHome={onHome} onFootball={onFootball} />
      <FootballExperienceBar searchTerm={searchTerm} onSearch={onSearch} onClear={onClearSearch} lastUpdatedAt={data.lastUpdatedAt} totalMatches={competitionMatches.length} />

      <div className="grid items-start gap-[var(--bds-space-24)] xl:grid-cols-[14rem_minmax(0,1fr)_18rem] 2xl:grid-cols-[16rem_minmax(0,1fr)_20rem]">
        <FootballSidebar {...sidebarProps} />

        <main className="min-w-0 space-y-[var(--bds-space-40)]">
          <FootballCompetitionHero config={config} competition={competition} matches={competitionMatches} teamCount={teamCount} liveCount={liveCount} />

          {!competitionMatches.length ? (
            <FootballPanel title="Competição ainda sem partidas" eyebrow="Dados carregados" icon={config.icon}>
              <FootballEmptyState title={`Ainda não há partidas de ${config.label}`} description="Quando os jogos estiverem presentes nos dados sincronizados, esta página será preenchida automaticamente." actionLabel="Voltar ao Football Center" onAction={onFootball} />
            </FootballPanel>
          ) : (
            <>
              <FootballSummaryCards stats={derived.stats} cards={summaryCards} onSelect={onFilter} />
              <FootballFilterBar activeFilter={activeFilter} onChange={onFilter} onOpenMenu={onDrawerOpen} filters={FOOTBALL_COMPETITION_FILTERS} />

              {searchTerm ? <FootballSection title={`Resultados para “${searchTerm}”`} eyebrow={`${derived.matches.length} partidas encontradas`} icon={config.icon} matches={derived.matches} onOpen={onOpenMatch} emptyTitle="Nenhuma partida encontrada" emptyDescription="Tente outro time ou confronto dentro desta competição." favoriteKeys={favoriteKeys} onFavorite={onFavoriteMatch} onClear={onClearFilters} /> : null}

              {!searchTerm && focusedView ? <FootballSection title={focusedView.title} eyebrow={focusedView.eyebrow} icon={focusedView.icon} matches={derived.matches} onOpen={onOpenMatch} emptyTitle={`Nenhuma partida em “${focusedView.title}”`} emptyDescription="Ajuste os filtros para explorar os outros jogos da competição." favoriteKeys={favoriteKeys} onFavorite={onFavoriteMatch} onClear={onClearFilters} /> : null}

              {!searchTerm && activeFilter === 'all' ? <>
                <FootballSection title="Ao Vivo" eyebrow="Em andamento" icon={Radio} matches={derived.live} onOpen={onOpenMatch} emptyTitle="Nenhuma partida ao vivo" emptyDescription="A competição não possui jogos em andamento neste momento." favoriteKeys={favoriteKeys} onFavorite={onFavoriteMatch} onClear={onClearFilters} />
                <FootballSection title="Jogos de Hoje" eyebrow="Agenda do dia" icon={Activity} matches={derived.today} onOpen={onOpenMatch} emptyTitle="Nenhum jogo hoje" emptyDescription="Confira os próximos confrontos desta competição." favoriteKeys={favoriteKeys} onFavorite={onFavoriteMatch} onClear={onClearFilters} />
                <FootballSection title="Próximos Jogos" eyebrow="Agenda da competição" icon={Clock3} matches={derived.upcoming} onOpen={onOpenMatch} emptyTitle="Nenhum próximo jogo" emptyDescription="A agenda será atualizada com os dados já sincronizados." favoriteKeys={favoriteKeys} onFavorite={onFavoriteMatch} onClear={onClearFilters} />
                <FootballSection title="Últimos Resultados" eyebrow="Placares confirmados" icon={CheckCircle2} matches={derived.results} onOpen={onOpenMatch} emptyTitle="Nenhum resultado disponível" emptyDescription="Os resultados aparecerão conforme as partidas forem concluídas." favoriteKeys={favoriteKeys} onFavorite={onFavoriteMatch} onClear={onClearFilters} />
              </> : null}
            </>
          )}
        </main>

        <div className="hidden xl:sticky xl:top-[var(--bds-space-16)] xl:block xl:h-[calc(100vh-var(--bds-space-32))] xl:overflow-y-auto xl:pr-[var(--bds-space-4)] xl:[scrollbar-width:thin]"><FootballRightPanel data={{ ...data, teams: competitionTeams }} derived={derived} statCards={sideStats} focused onOpen={onOpenMatch} /></div>
      </div>

      <div className="xl:hidden"><FootballRightPanel data={{ ...data, teams: competitionTeams }} derived={derived} statCards={sideStats} focused onOpen={onOpenMatch} /></div>
    </section>
  )
}
