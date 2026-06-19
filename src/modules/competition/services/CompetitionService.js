import { createCompetition } from '../domain/Competition'
import { createMatch } from '../domain/Match'
import { createRound } from '../domain/Round'
import { createSeason } from '../domain/Season'
import { createStage } from '../domain/Stage'
import { CompetitionValidator } from '../validators/CompetitionValidator'
import { MatchValidator } from '../validators/MatchValidator'

export function createCompetitionService(options = {}) {
  const repository = options.repository

  return {
    createCompetition(data = {}) {
      const competition = createCompetition(data)
      const validation = CompetitionValidator.validate(competition)

      if (!validation.valid) {
        return {
          ok: false,
          competition,
          errors: validation.errors,
        }
      }

      return {
        ok: true,
        competition: repository?.save('competitions', competition) || competition,
        errors: [],
      }
    },

    createSeason(data = {}) {
      const season = createSeason(data)
      return repository?.save('seasons', season) || season
    },

    createStage(data = {}) {
      const stage = createStage(data)
      return repository?.save('stages', stage) || stage
    },

    createRound(data = {}) {
      const round = createRound(data)
      return repository?.save('rounds', round) || round
    },

    createMatch(data = {}) {
      const match = createMatch(data)
      const validation = MatchValidator.validate(match)

      if (!validation.valid) {
        return {
          ok: false,
          match,
          errors: validation.errors,
        }
      }

      return {
        ok: true,
        match: repository?.save('matches', match) || match,
        errors: [],
      }
    },

    listCompetitions() {
      return repository?.list('competitions') || []
    },

    listSeasons(competitionId) {
      return repository?.list(
        'seasons',
        (season) => !competitionId || season.competitionId === competitionId,
      ) || []
    },

    listStages(seasonId) {
      return repository?.list('stages', (stage) => !seasonId || stage.seasonId === seasonId) || []
    },

    listRounds(stageId) {
      return repository?.list('rounds', (round) => !stageId || round.stageId === stageId) || []
    },

    listMatches(roundId) {
      return repository?.list('matches', (match) => !roundId || match.roundId === roundId) || []
    },
  }
}
