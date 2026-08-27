import { listPublishedEvents } from '../../events/services/eventsService'

const COMMUNITY_OVERVIEW_ENDPOINT = '/api/community/overview'

async function loadOverview() {
  const response = await fetch(COMMUNITY_OVERVIEW_ENDPOINT, {
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || 'Nao foi possivel carregar a comunidade agora.')
  }

  return payload?.data || { stats: {}, members: [] }
}

export async function loadCommunityPageData() {
  const [overviewResult, eventsResult] = await Promise.allSettled([
    loadOverview(),
    listPublishedEvents({ limit: 6 }),
  ])

  const overview = overviewResult.status === 'fulfilled'
    ? overviewResult.value
    : { stats: {}, members: [] }

  const events = eventsResult.status === 'fulfilled'
    ? (eventsResult.value?.data || [])
    : []

  const errors = []
  if (overviewResult.status === 'rejected') errors.push(overviewResult.reason)
  if (eventsResult.status === 'rejected' || eventsResult.value?.error) {
    errors.push(eventsResult.reason || eventsResult.value.error)
  }

  return {
    stats: overview.stats || {},
    members: Array.isArray(overview.members) ? overview.members : [],
    events,
    errors,
  }
}
