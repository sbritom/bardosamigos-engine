import { useState } from 'react'
import { Alert, Button, Card, Input, Textarea } from '../../../../design-system'
import { closeMatchWithOfficialResult } from '../../services/competitionResultService'
import { CompetitionAdminLayout } from './CompetitionAdminLayout'

export default function MatchResultsPage() {
  const [form, setForm] = useState({ matchId: '', homeScore: 0, awayScore: 0, notes: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const result = await closeMatchWithOfficialResult(form)
    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setMessage(`Resultado salvo. ${result.data.scoredPredictions.length} palpites recalculados.`)
  }

  return (
    <CompetitionAdminLayout>
      <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
        <div className="mb-5">
          <div className="text-xs font-black uppercase text-[var(--bds-color-primary-hover)]">Encerramento</div>
          <h1 className="text-2xl font-black">Resultado oficial do jogo</h1>
          <p className="mt-2 text-[var(--bds-color-text-secondary)]">
            Informe o placar oficial para bloquear palpites, recalcular pontos, rankings e registrar auditoria.
          </p>
        </div>

        {message && <Alert status="success" title="Sucesso">{message}</Alert>}
        {error && <Alert status="danger" title="Erro">{error}</Alert>}

        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Input label="ID do jogo" value={form.matchId} onChange={(event) => setForm({ ...form, matchId: event.target.value })} required />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Placar mandante" type="number" min="0" value={form.homeScore} onChange={(event) => setForm({ ...form, homeScore: Number(event.target.value) })} required />
            <Input label="Placar visitante" type="number" min="0" value={form.awayScore} onChange={(event) => setForm({ ...form, awayScore: Number(event.target.value) })} required />
          </div>
          <Textarea label="Observacoes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar resultado oficial'}</Button>
          </div>
        </form>
      </Card>
    </CompetitionAdminLayout>
  )
}
