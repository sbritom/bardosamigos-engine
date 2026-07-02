import { useState } from 'react'
import { Button, Loading } from '../../../../design-system'
import { SYNC_INTEGRATIONS } from '../../../../core/sync'
import { syncAdminService } from '../../../../core/sync/admin'
import { GNEWS_CATEGORIES } from '../../../../core/sync/providers/gnews'
import { formatBrazilFullDateTime, nowUtcIso } from '../../../../core/time'

export function GNewsSyncPanel() {
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState(null)

  async function handleSyncNow() {
    const startedAt = performance.now()
    setRunning(true)

    const result = await syncAdminService.syncNow(SYNC_INTEGRATIONS.GNEWS, {
      categories: Object.values(GNEWS_CATEGORIES),
    })

    setLastRun({
      finishedAt: nowUtcIso(),
      elapsedMs: Math.round(performance.now() - startedAt),
      records: result.records || 0,
      status: result.status,
      errors: result.error ? [result.error.message] : result.metadata?.errors || [],
    })
    setRunning(false)
  }

  return (
    <section className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--secondary)]">GNews</p>
          <h2 className="mt-1 text-xl font-black text-[var(--gold)]">Sincronizacao de Noticias</h2>
          <p className="mt-2 text-sm text-[var(--secondary)]">
            Sincroniza Futebol, Esportes e Brasil para o Supabase. Home e Noticias seguem lendo apenas dados sincronizados.
          </p>
        </div>
        <Button disabled={running} onClick={handleSyncNow}>
          Sincronizar Agora
        </Button>
      </div>

      {running && (
        <div className="mt-4">
          <Loading label="Sincronizando GNews" />
        </div>
      )}

      {lastRun && (
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-5">
          <div className="rounded-xl border border-[var(--border)] bg-black p-3">
            <div className="text-[var(--secondary)]">Ultima sincronizacao</div>
            <div className="font-black">{formatBrazilFullDateTime(lastRun.finishedAt)}</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black p-3">
            <div className="text-[var(--secondary)]">Noticias</div>
            <div className="font-black">{lastRun.records}</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black p-3">
            <div className="text-[var(--secondary)]">Tempo</div>
            <div className="font-black">{lastRun.elapsedMs}ms</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black p-3">
            <div className="text-[var(--secondary)]">Status</div>
            <div className="font-black">{lastRun.status}</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black p-3">
            <div className="text-[var(--secondary)]">Erros</div>
            <div className="font-black">{lastRun.errors.length || 'Nenhum'}</div>
          </div>
        </div>
      )}
    </section>
  )
}
