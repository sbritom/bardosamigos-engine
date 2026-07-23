import { useMemo } from 'react'
import { isFinishedStatus, isLiveStatus, nowUtcIso } from '../../../../core/time'
import { FOOTBALL_COMPETITION_NAV } from '../constants/footballCenterConstants'
import {
  footballMatchBelongsToCompetition,
  footballMatchIncludesSearch,
  getFootballRecentResults,
  getFootballTodayMatches,
  getFootballUpcomingMatches,
  isFootballFavoriteMatch,
  isFootballMatchThisWeek,
  isFootballMatchToday,
  isFootballMatchTomorrow,
  normalizeFootballSearch,
  selectFootballHeroMatch,
} from '../utils/footballCenterUtils'

export function useFootballCenterView({ data, activeCompetition, activeFilter, favoriteKeys, searchTerm }) {
  return useMemo(() => {
    const now = nowUtcIso()
    const teamsByName = new Map((data?.teams || []).map((team) => [team.name, team.id]))
    const allMatches = (data?.matches || []).map((match) => ({
      ...match,
      homeTeamId: teamsByName.get(match.homeTeam),
      awayTeamId: teamsByName.get(match.awayTeam),
    }))
    const query = normalizeFootballSearch(searchTerm)
    let scopedMatches = allMatches

    if (activeCompetition === 'favorites') {
      scopedMatches = allMatches.filter((match) => isFootballFavoriteMatch(match, favoriteKeys))
    } else if (activeCompetition !== 'all') {
      const item = FOOTBALL_COMPETITION_NAV.find((navItem) => navItem.id === activeCompetition)
      if (item) scopedMatches = allMatches.filter((match) => footballMatchBelongsToCompetition(match, item))
    }

    const searchedMatches = scopedMatches.filter((match) => footballMatchIncludesSearch(match, query))
    let matches = searchedMatches
    if (activeFilter === 'today') matches = searchedMatches.filter((match) => isFootballMatchToday(match, now))
    if (activeFilter === 'tomorrow') matches = searchedMatches.filter((match) => isFootballMatchTomorrow(match, now))
    if (activeFilter === 'week') matches = searchedMatches.filter((match) => isFootballMatchThisWeek(match, now))
    if (activeFilter === 'live') matches = searchedMatches.filter((match) => isLiveStatus(match.status))
    if (activeFilter === 'finished') matches = searchedMatches.filter((match) => isFinishedStatus(match.status))
    if (activeFilter === 'results') matches = getFootballRecentResults(searchedMatches)
    if (activeFilter === 'upcoming') matches = getFootballUpcomingMatches(searchedMatches, now)
    if (activeFilter === 'favorites') matches = searchedMatches.filter((match) => isFootballFavoriteMatch(match, favoriteKeys))

    const sectionSource = activeFilter === 'all' ? searchedMatches : matches
    const live = sectionSource.filter((match) => isLiveStatus(match.status))
    const today = getFootballTodayMatches(sectionSource, now)
    const results = getFootballRecentResults(sectionSource)
    const upcoming = getFootballUpcomingMatches(sectionSource, now)
    const goals = results.reduce((total, match) => total + Number(match.homeScore || 0) + Number(match.awayScore || 0), 0)
    const monitoredTeams = new Set(sectionSource.flatMap((match) => [match.homeTeam, match.awayTeam]).filter(Boolean)).size
    const searchTeams = query
      ? (data?.teams || []).filter((team) => normalizeFootballSearch(`${team.name} ${team.competitionName || ''}`).includes(query))
      : []
    const searchCompetitions = query
      ? (data?.competitions || []).filter((competition) => normalizeFootballSearch(`${competition.name} ${competition.code || ''}`).includes(query))
      : []

    return {
      matches,
      searchedMatches,
      hero: selectFootballHeroMatch({ matches }, now),
      live,
      today,
      results,
      upcoming,
      searchTeams,
      searchCompetitions,
      stats: {
        total: searchedMatches.length,
        live: searchedMatches.filter((match) => isLiveStatus(match.status)).length,
        today: getFootballTodayMatches(searchedMatches, now).length,
        finished: getFootballRecentResults(searchedMatches).length,
        upcoming: getFootballUpcomingMatches(searchedMatches, now).length,
        competitions: new Set(searchedMatches.map((match) => match.competitionId).filter(Boolean)).size,
        goals,
        teams: monitoredTeams,
      },
    }
  }, [activeCompetition, activeFilter, data, favoriteKeys, searchTerm])
}
