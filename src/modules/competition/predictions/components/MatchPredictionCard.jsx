import { CalendarDays, Lock, MapPin, Pencil, Target, Trash2 } from 'lucide-react'
import { getSportsStatusLabel } from '../../../../core/sports'
import { formatBrazilFullDateTime, isFinishedStatus } from '../../../../core/time'

function formatDate(value) {
  return value ? formatBrazilFullDateTime(value) : '-'
}

function formatScore(prediction) {
  if (!prediction?.prediction) return null
  return `${prediction.prediction.homeScore} x ${prediction.prediction.awayScore}`
}

function formatMatchScore(match) {
  const homeScore = match.homeScore ?? match.home_score
  const awayScore = match.awayScore ?? match.away_score

  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) return 'x'
  return `${homeScore} x ${awayScore}`
}

export function MatchPredictionCard({ match, onPredict, onEdit, onDelete }) {
  const season = match.competitionRounds?.competitionStages?.competitionSeasons
  const competition = season?.competitions
  const metadata = match.metadata || {}
  const closed = match.closed || isFinishedStatus(match.standardStatus || match.standard_status || match.status)
  const homeCrest = match.homeCrest || match.home_crest || metadata.homeShield
  const awayCrest = match.awayCrest || match.away_crest || metadata.awayShield
  const competitionLogo = competition?.logoUrl || competition?.logo_url || metadata.competition?.logoUrl || match.competitionLogo || match.competition_logo
  const statusLabel = getSportsStatusLabel(match.standardStatus || match.standard_status || match.status)

  return (
    <article className={`imortal-prediction-card ${match.myPrediction ? 'has-prediction' : ''} ${closed ? 'is-closed' : ''}`}>
      <header className="imortal-prediction-card__head">
        <div className="imortal-prediction-card__competition">
          {competitionLogo ? <img src={competitionLogo} alt="" loading="lazy" /> : null}
          <div>
            <strong>{competition?.name || metadata.competition?.namePtBr || 'Competição'}</strong>
            <small>{season?.name || match.competitionRounds?.name || 'Futebol'}</small>
          </div>
        </div>

        <span className={`imortal-prediction-status ${closed ? 'is-closed' : ''}`}>
          {closed ? <Lock size={12} /> : null}
          {closed ? 'Fechado' : statusLabel}
        </span>
      </header>

      <div className="imortal-prediction-match">
        <div className="imortal-prediction-team">
          <span className="imortal-prediction-crest">
            {homeCrest ? <img src={homeCrest} alt="" loading="lazy" /> : <strong>{String(match.homeParticipant || 'M').slice(0, 2)}</strong>}
          </span>
          <strong>{match.homeParticipant || 'Mandante'}</strong>
        </div>

        <div className="imortal-prediction-score">
          <small>PLACAR</small>
          <strong>{formatMatchScore(match)}</strong>
        </div>

        <div className="imortal-prediction-team is-away">
          <span className="imortal-prediction-crest">
            {awayCrest ? <img src={awayCrest} alt="" loading="lazy" /> : <strong>{String(match.awayParticipant || 'V').slice(0, 2)}</strong>}
          </span>
          <strong>{match.awayParticipant || 'Visitante'}</strong>
        </div>
      </div>

      <div className="imortal-prediction-meta">
        <span><CalendarDays size={13} />{formatDate(match.startsAt)}</span>
        {(match.venue || metadata.venue) ? <span><MapPin size={13} />{match.venue || metadata.venue}</span> : null}
      </div>

      {match.myPrediction ? (
        <div className="imortal-prediction-my">
          <div>
            <span>MEU PALPITE</span>
            <strong>{formatScore(match.myPrediction)}</strong>
          </div>
          <div className="imortal-prediction-actions">
            <button type="button" disabled={closed} onClick={() => onEdit(match)}>
              <Pencil size={14} /> Editar
            </button>
            <button type="button" className="is-danger" disabled={closed} onClick={() => onDelete(match)}>
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="imortal-prediction-primary" disabled={closed} onClick={() => onPredict(match)}>
          {closed ? <Lock size={15} /> : <Target size={15} />}
          {closed ? 'Palpites encerrados' : 'Fazer palpite'}
        </button>
      )}
    </article>
  )
}
