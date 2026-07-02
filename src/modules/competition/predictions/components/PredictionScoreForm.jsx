import { useState } from 'react'
import { Button, Input } from '../../../../design-system'

export function PredictionScoreForm({ initialValue, onSubmit, submitLabel = 'Salvar palpite' }) {
  const [score, setScore] = useState({
    homeScore: initialValue?.homeScore ?? 0,
    awayScore: initialValue?.awayScore ?? 0,
  })

  function submit(event) {
    event.preventDefault()
    onSubmit(score)
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Mandante" type="number" min="0" value={score.homeScore} onChange={(event) => setScore({ ...score, homeScore: event.target.value })} />
        <Input label="Visitante" type="number" min="0" value={score.awayScore} onChange={(event) => setScore({ ...score, awayScore: event.target.value })} />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  )
}
