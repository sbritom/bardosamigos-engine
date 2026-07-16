import { Button } from '../../../../design-system'

export function GNewsSyncPanel() {
  return (
    <section className="rounded-[18px] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--bds-color-text-secondary)]">GNews</p>
          <h2 className="mt-1 text-xl font-black text-[var(--bds-color-primary-hover)]">Sincronizacao de Noticias</h2>
          <p className="mt-2 text-sm text-[var(--bds-color-text-secondary)]">
            A sincronizacao da GNews roda no servidor via Vercel Cron as 08:00 e 18:00 de Brasilia.
            Execucoes manuais devem usar o endpoint protegido com CRON_SECRET.
          </p>
        </div>
        <Button disabled>
          Sync protegido no servidor
        </Button>
      </div>
    </section>
  )
}
