import { classNames } from '../utils'

export const STATUS_BADGE_TONES = Object.freeze({
  AO_VIVO: 'live',
  LIVE: 'live',
  IN_PLAY: 'live',
  'IN PLAY': 'live',
  'EM ANDAMENTO': 'live',
  PAUSED: 'warning',
  FINALIZADO: 'neutral',
  FINISHED: 'neutral',
  'EM BREVE': 'soon',
  SOON: 'soon',
  NOVO: 'info',
  NEW: 'info',
  DESTAQUE: 'highlight',
  FEATURED: 'highlight',
  SUCESSO: 'success',
  SUCCESS: 'success',
  ALERTA: 'warning',
  WARNING: 'warning',
  ERRO: 'danger',
  ERROR: 'danger',
})

function resolveStatusBadgeTone(status) {
  const normalized = String(status || '').trim().toUpperCase().replace(/\s+/g, ' ')
  const comparable = normalized.replace(/-/g, '_')

  if (STATUS_BADGE_TONES[normalized]) return STATUS_BADGE_TONES[normalized]
  if (STATUS_BADGE_TONES[comparable]) return STATUS_BADGE_TONES[comparable]
  if (/^(AO[\s_]VIVO|LIVE|IN[\s_]PLAY|EM ANDAMENTO)(\b|[\s\d'])/.test(comparable)) return 'live'

  return 'neutral'
}

export function StatusBadge({ status, children, tone, className }) {
  const label = children || status
  const resolvedTone = tone || resolveStatusBadgeTone(status || label)

  return <span className={classNames('bds-status-badge', `bds-status-badge--${resolvedTone}`, className)}>{label}</span>
}
