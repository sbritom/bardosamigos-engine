import { useState } from 'react'
import { Button, Loading } from '../../../../design-system'
import { SYNC_INTEGRATIONS } from '../../../../core/sync'
import { syncAdminService } from '../../../../core/sync/admin'
import { FOOTBALL_DATA_SYNC_TYPES } from '../../../../core/sync/providers/footballData'
import { formatBrazilFullDateTime, nowUtcIso } from '../../../../core/time'

const syncSteps = [
  FOOTBALL_DATA_SYNC_TYPES.COMPETITIONS,
  FOOTBALL_DATA_SYNC_TYPES.TEAMS,
  FOOTBALL_DATA_SYNC_TYPES.UPCOMING_MATCHES,
  FOOTBALL_DATA_SYNC_TYPES.FINISHED_MATCHES,
  FOOTBALL_DATA_SYNC_TYPES.STANDINGS,
]

export function FootballDataSyncPanel() {
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState(null)

  async function handleSyncNow() {
    const startedAt = performance.now()
    setRunning(true)

    const results = []
    for (const type of syncSteps) {
      results.push(await syncAdminService.syncNow(SYNC_INTEGRATIONS.FOOTBALL_DATA, { type }))
    }

    setLastRun({
      finishedAt: nowUtcIso(),
      elapsedMs: Math.round(performance.now() - startedAt),
      records: results.reduce((total, item) => total + (item.records || 0), 0),
      errors: results.filter((item) => item.error).map((item) => item.error.message),
      results,
    })
    setRunning(false)
  }

  return (
    <section className="rounded-[18px] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--bds-color-text-secondary)]">Football-Data</p>
          <h2 className="mt-1 text-xl font-black text-[var(--bds-color-primary-hover)]">Sincronizacao</h2>
          <p className="mt-2 text-sm text-[var(--bds-color-text-secondary)]">
            Executa a sincronizacao via Sync Engine e mantem Home e Competition consumindo apenas Supabase.
          </p>
        </div>
        <Button disabled={running} onClick={handleSyncNow}>
          Sincronizar Agora
        </Button>
      </div>

      {running && (
        <div className="mt-4">
          <Loading label="Sincronizando Football-Data" />
        </div>
      )}

      {lastRun && (
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] p-3">
            <div className="text-[var(--bds-color-text-secondary)]">Ultima sincronizacao</div>
            <div className="font-black">{formatBrazilFullDateTime(lastRun.finishedAt)}</div>
          </div>
          <div className="rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] p-3">
            <div className="text-[var(--bds-color-text-secondary)]">Registros</div>
            <div className="font-black">{lastRun.records}</div>
          </div>
          <div className="rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] p-3">
            <div className="text-[var(--bds-color-text-secondary)]">Tempo</div>
            <div className="font-black">{lastRun.elapsedMs}ms</div>
          </div>
          <div className="rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] p-3">
            <div className="text-[var(--bds-color-text-secondary)]">Erros</div>
            <div className="font-black">{lastRun.errors.length || 'Nenhum'}</div>
          </div>
        </div>
      )}
    </section>
  )
}
