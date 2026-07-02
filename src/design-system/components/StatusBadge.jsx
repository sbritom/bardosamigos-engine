import { classNames } from '../utils'

export const STATUS_BADGE_TONES = Object.freeze({
  AO_VIVO: 'live',
  LIVE: 'live',
  IN_PLAY: 'live',
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

export function StatusBadge({ status, children, tone, className }) {
  const label = children || status
  const normalized = String(status || label || '').toUpperCase()
  const resolvedTone = tone || STATUS_BADGE_TONES[normalized] || 'neutral'

  return <span className={classNames('bds-status-badge', `bds-status-badge--${resolvedTone}`, className)}>{label}</span>
}
