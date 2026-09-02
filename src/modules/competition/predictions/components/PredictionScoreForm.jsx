import { useState } from 'react'
import { Target } from 'lucide-react'

export function PredictionScoreForm({ match, initialValue, onSubmit, submitLabel = 'Salvar palpite' }) {
  const [score, setScore] = useState({
    homeScore: initialValue?.homeScore ?? 0,
    awayScore: initialValue?.awayScore ?? 0,
  })

  function submit(event) {
    event.preventDefault()
    onSubmit(score)
  }

  return (
    <form className="imortal-prediction-form" onSubmit={submit}>
      {match ? (
        <div className="imortal-prediction-form__teams">
          <strong>{match.homeParticipant || 'Mandante'}</strong>
          <span>×</span>
          <strong>{match.awayParticipant || 'Visitante'}</strong>
        </div>
      ) : null}

      <p>Digite o placar que você acredita que terminará a partida.</p>

      <div className="imortal-prediction-form__score">
        <label>
          <span>Mandante</span>
          <input
            type="number"
            min="0"
            max="99"
            value={score.homeScore}
            onChange={(event) => setScore({ ...score, homeScore: event.target.value })}
          />
        </label>

        <strong>×</strong>

        <label>
          <span>Visitante</span>
          <input
            type="number"
            min="0"
            max="99"
            value={score.awayScore}
            onChange={(event) => setScore({ ...score, awayScore: event.target.value })}
          />
        </label>
      </div>

      <button type="submit" className="imortal-prediction-form__submit">
        <Target size={16} />
        {submitLabel}
      </button>
    </form>
  )
}
