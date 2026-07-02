import { Badge, Button, Card } from '../../../../design-system'
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
    <Card className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[var(--gold)]">
            {competitionLogo && <img src={competitionLogo} alt="" className="h-5 w-5 object-contain" loading="lazy" />}
            <span>{competition?.name || metadata.competition?.namePtBr || 'Competição'}</span>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0">
              {homeCrest && <img src={homeCrest} alt="" className="mb-2 h-10 w-10 object-contain" loading="lazy" />}
              <h2 className="truncate text-xl font-black">{match.homeParticipant || 'Mandante'}</h2>
            </div>
            <div className="text-lg font-black text-[var(--gold)]">{formatMatchScore(match)}</div>
            <div className="min-w-0 text-right">
              {awayCrest && <img src={awayCrest} alt="" className="mb-2 ml-auto h-10 w-10 object-contain" loading="lazy" />}
              <h2 className="truncate text-xl font-black">{match.awayParticipant || 'Visitante'}</h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--secondary)]">
            {season?.name || 'Temporada'} • {match.competitionRounds?.name || 'Rodada'} • {formatDate(match.startsAt)}
          </p>
          {(match.venue || metadata.venue || match.country || metadata.country) && (
            <p className="mt-1 text-xs font-bold text-[var(--secondary)]">
              {[match.venue || metadata.venue, match.country || metadata.country].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
        <Badge>{closed ? 'Fechado' : statusLabel}</Badge>
      </div>

      {match.myPrediction ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-black p-3">
          <div className="text-xs font-black uppercase text-[var(--secondary)]">Meu palpite</div>
          <div className="mt-1 text-2xl font-black text-[var(--gold)]">{formatScore(match.myPrediction)}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={closed} onClick={() => onEdit(match)}>Editar</Button>
            <Button variant="danger" disabled={closed} onClick={() => onDelete(match)}>Excluir</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button disabled={closed} onClick={() => onPredict(match)}>{closed ? 'Palpites encerrados' : 'Fazer palpite'}</Button>
        </div>
      )}
    </Card>
  )
}
