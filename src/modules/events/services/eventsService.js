import { getSupabaseClient } from '../../../core/database/client/supabaseClient.js'

const EVENT_SELECT_FIELDS = 'id,title,slug,description,location,starts_at,ends_at,status,capacity,metadata,created_at,updated_at,deleted_at,version'

export function normalizeEventMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {}
  }

  return metadata
}

export function isTruthy(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function getEventType(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return metadata.type || metadata.eventType || metadata.category || metadata.kind || null
}

export function getEventImage(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return metadata.imageUrl || metadata.image || metadata.coverUrl || metadata.cover || null
}

export function getEventSummary(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return metadata.summary || metadata.shortDescription || event.description || null
}

export function getEventTimeLabel(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return metadata.timeLabel || metadata.time || null
}

export function getEventRecurrenceLabel(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return metadata.recurrence || metadata.repeat || metadata.frequency || null
}

export function getParticipationRule(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return metadata.participationRule || metadata.rule || metadata.requirement || null
}

export function getEventActionUrl(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  const configuredUrl = metadata.actionUrl || metadata.url || metadata.link || metadata.participationUrl

  if (configuredUrl) return configuredUrl

  if (typeof event.location === 'string' && event.location.toLowerCase().includes('xat.com/bardosamigos')) {
    return 'https://xat.com/BarDosAmigos'
  }

  return null
}

export function isFeaturedEvent(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return isTruthy(metadata.featured) || isTruthy(metadata.highlighted) || isTruthy(metadata.isFeatured)
}

export function isRecurringEvent(event = {}) {
  const metadata = normalizeEventMetadata(event.metadata)
  return isTruthy(metadata.recurring) || Boolean(metadata.recurrence || metadata.repeat || metadata.frequency)
}

export function formatEventDate(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatEventTime(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getEventTimestamp(event = {}) {
  const date = new Date(event.starts_at || event.startsAt || 0)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function getHomePriority(event = {}, now = new Date()) {
  if (isFeaturedEvent(event)) return 0
  if (isRecurringEvent(event)) return 1

  const timestamp = getEventTimestamp(event)
  if (timestamp >= now.getTime()) return 2

  return 3
}

export function sortEventsForHome(events = [], now = new Date()) {
  return [...events].sort((left, right) => {
    const leftPriority = getHomePriority(left, now)
    const rightPriority = getHomePriority(right, now)

    if (leftPriority !== rightPriority) return leftPriority - rightPriority

    const leftTime = getEventTimestamp(left)
    const rightTime = getEventTimestamp(right)

    if (leftTime && rightTime) return leftTime - rightTime
    if (leftTime) return -1
    if (rightTime) return 1

    return String(left.title || '').localeCompare(String(right.title || ''), 'pt-BR')
  })
}

export function normalizeEvent(rawEvent = {}) {
  const metadata = normalizeEventMetadata(rawEvent.metadata)
  const event = {
    ...rawEvent,
    metadata,
    startsAt: rawEvent.starts_at || rawEvent.startsAt || null,
    endsAt: rawEvent.ends_at || rawEvent.endsAt || null,
    deletedAt: rawEvent.deleted_at || rawEvent.deletedAt || null,
    createdAt: rawEvent.created_at || rawEvent.createdAt || null,
    updatedAt: rawEvent.updated_at || rawEvent.updatedAt || null,
  }

  const dateLabel = formatEventDate(event.starts_at || event.startsAt)
  const timeLabel = getEventTimeLabel(event) || formatEventTime(event.starts_at || event.startsAt)
  const recurrenceLabel = getEventRecurrenceLabel(event)

  return {
    ...event,
    featured: isFeaturedEvent(event),
    recurring: isRecurringEvent(event),
    typeLabel: getEventType(event),
    image: getEventImage(event),
    summary: getEventSummary(event),
    dateLabel,
    timeLabel,
    recurrenceLabel,
    participationRule: getParticipationRule(event),
    actionUrl: getEventActionUrl(event),
    homeDateLabel: recurrenceLabel || dateLabel || null,
    homeTimeLabel: timeLabel || null,
  }
}

export async function listPublishedEvents({ client = getSupabaseClient(), limit } = {}) {
  if (!client) {
    return { data: [], error: new Error('Supabase client is not configured.') }
  }

  let request = client
    .from('events')
    .select(EVENT_SELECT_FIELDS)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('starts_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (limit) {
    request = request.limit(limit)
  }

  const { data, error } = await request

  return {
    data: error ? [] : (data || []).map(normalizeEvent),
    error,
  }
}

export async function listHomeEvents({ client = getSupabaseClient(), limit = 3 } = {}) {
  const result = await listPublishedEvents({ client })

  return {
    data: sortEventsForHome(result.data).slice(0, limit),
    error: result.error,
  }
}
