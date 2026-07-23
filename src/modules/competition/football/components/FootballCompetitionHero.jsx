import { Activity, Shield, Trophy, Users } from 'lucide-react'
import { isFinishedStatus } from '../../../../core/time'
import { FootballStatusBadge } from './FootballCommon'
import { FootballStadiumBackdrop } from './FootballHero'

export function FootballCompetitionHero({ config, competition, matches, teamCount, liveCount }) {
  const logo = competition?.logo || matches.find((match) => match.competitionLogo)?.competitionLogo
  const backgroundImage = competition?.backgroundImage || competition?.image || competition?.metadata?.backgroundImage || ''
  const finishedCount = matches.filter((match) => isFinishedStatus(match.status)).length
  const status = liveCount ? 'AO_VIVO' : matches.length && finishedCount === matches.length ? 'FINALIZADO' : 'SCHEDULED'
  const Icon = config.icon || Trophy

  return (
    <section className="relative isolate overflow-hidden rounded-[var(--bds-radius-hero)] border border-[color-mix(in_srgb,var(--bds-color-primary-hover)_32%,var(--bds-color-border))] bg-[var(--bds-color-background)] p-[var(--bds-space-24)] shadow-[var(--bds-shadow-hero)] sm:p-[var(--bds-space-40)]">
      {backgroundImage ? <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-[var(--bds-opacity-muted)]" style={{ backgroundImage: `url("${backgroundImage}")` }} /> : <FootballStadiumBackdrop />}
      <div className="absolute inset-0 -z-0 bg-[linear-gradient(110deg,var(--bds-color-background),color-mix(in_srgb,var(--bds-color-background)_82%,transparent)_58%,var(--bds-color-background))]" />
      <div className="absolute inset-x-[var(--bds-space-24)] top-0 -z-0 h-px bg-[linear-gradient(90deg,transparent,var(--bds-color-primary-hover),transparent)] opacity-[var(--bds-opacity-muted)]" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-[var(--bds-space-24)]">
          <div className="flex min-w-0 items-center gap-[var(--bds-space-24)]">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[var(--bds-radius-lg)] border border-[color-mix(in_srgb,var(--bds-color-primary-hover)_32%,var(--bds-color-border))] bg-[color-mix(in_srgb,var(--bds-color-background)_86%,transparent)] p-[var(--bds-space-16)] shadow-[var(--bds-shadow-level-3)] backdrop-blur-md sm:h-32 sm:w-32">
              {logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <Icon size={48} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-primary-hover)]">Centro de competições</p>
              <h1 className="mt-[var(--bds-space-8)] text-3xl font-black leading-[0.95] tracking-tight text-[var(--bds-color-text)] sm:text-5xl">{config.label}</h1>
              <p className="mt-[var(--bds-space-16)] max-w-xl text-sm leading-relaxed text-[var(--bds-color-text-secondary)]">Partidas, resultados e agenda da competição em um único lugar.</p>
            </div>
          </div>
          <FootballStatusBadge status={status} />
        </div>

        <div className="mt-[var(--bds-space-40)] grid gap-[var(--bds-space-16)] border-t border-[var(--bds-color-border)] pt-[var(--bds-space-24)] sm:grid-cols-3">
          <div className="flex items-center gap-[var(--bds-space-16)] rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-background)_72%,transparent)] p-[var(--bds-space-16)] shadow-[var(--bds-shadow-level-1)]"><Activity size={19} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" /><div><span className="block text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">Partidas</span><strong className="mt-[var(--bds-space-4)] block text-xl font-black text-[var(--bds-color-text)]">{matches.length}</strong></div></div>
          <div className="flex items-center gap-[var(--bds-space-16)] rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-background)_72%,transparent)] p-[var(--bds-space-16)] shadow-[var(--bds-shadow-level-1)]"><Users size={19} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" /><div><span className="block text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">Times</span><strong className="mt-[var(--bds-space-4)] block text-xl font-black text-[var(--bds-color-text)]">{teamCount}</strong></div></div>
          <div className="flex items-center gap-[var(--bds-space-16)] rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-background)_72%,transparent)] p-[var(--bds-space-16)] shadow-[var(--bds-shadow-level-1)]"><Shield size={19} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" /><div><span className="block text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">Competição</span><strong className="mt-[var(--bds-space-4)] block truncate text-sm text-[var(--bds-color-text)]">{competition?.name || config.label}</strong></div></div>
        </div>
      </div>
    </section>
  )
}
