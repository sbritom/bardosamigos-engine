import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { applyApiCors, rejectOversizedBody } from '../_lib/security.js'

const TABLE = 'radio_music_requests'
const LOCUTOR_STATUS_TABLE = 'radio_locutor_status'
const PROGRAMS_TABLE = 'radio_programs'
const SCHEDULE_TABLE = 'radio_schedule'
const VALID_STATUSES = new Set(['pending', 'read'])
const REQUEST_WINDOW_SECONDS = 60
const AUTHORIZED_ROLES = new Set(['admin', 'locutor'])
const PROVIDER_INTEGRATION_ID = 'imortal0800-primary'
const PROVIDER_TIMEOUT_MS = 8000

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase server credentials are not configured.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

async function fetchProvider(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'IMORTAL0800/1.0',
        ...(options.headers || {}),
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function getRadioProviderIntegration(supabase) {
  const { data, error } = await supabase
    .from('radio_provider_integrations')
    .select('provider,automatic_request_url,automatic_catalog_url,manual_request_url,enabled')
    .eq('id', PROVIDER_INTEGRATION_ID)
    .maybeSingle()

  if (error) throw error
  if (!data?.enabled) return null
  return data
}

function extractProviderTrackFilename(buttonHtml) {
  const html = String(buttonHtml || '')
  const match = html.match(/pedir\((?:&quot;|["'])?([^"'()<>]+?\.mp3)(?:&quot;|["'])?\)/i)
    || html.match(/pedir\(\\?["']([^"']+?\.mp3)\\?["']\)/i)
  return cleanText(match?.[1], 240)
}

function normalizeProviderCatalogItem(row, index) {
  if (!Array.isArray(row)) return null
  const label = cleanText(row[0], 220)
  const file = extractProviderTrackFilename(row[1])
  if (!label || !file) return null

  return {
    id: `${index}-${crypto.createHash('sha1').update(file).digest('hex').slice(0, 12)}`,
    label,
    file,
  }
}

async function fetchProviderCatalog(supabase) {
  const integration = await getRadioProviderIntegration(supabase)
  if (!integration?.automatic_catalog_url) {
    throw Object.assign(new Error('Catálogo do AutoDJ não está configurado.'), { status: 503 })
  }

  const providerResponse = await fetchProvider(integration.automatic_catalog_url, {
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
  })

  if (!providerResponse.ok) {
    throw Object.assign(new Error('Catálogo do AutoDJ indisponível.'), { status: 502 })
  }

  const payload = await providerResponse.json()
  return (Array.isArray(payload?.data) ? payload.data : [])
    .map(normalizeProviderCatalogItem)
    .filter(Boolean)
}

async function handleProviderCatalogGet(request, response, supabase) {
  const query = normalizeSearchText(cleanText(request.query?.q, 80))
  if (query.length < 2) {
    response.status(200).json({ ok: true, data: [] })
    return
  }

  const catalog = await fetchProviderCatalog(supabase)
  const terms = query.split(' ').filter(Boolean)

  const data = catalog
    .filter((item) => {
      const haystack = normalizeSearchText(item.label)
      return terms.every((term) => haystack.includes(term))
    })
    .slice(0, 12)

  response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
  response.status(200).json({ ok: true, data })
}

async function sendAutomaticProviderRequest(supabase, { trackFile, requesterName }) {
  const integration = await getRadioProviderIntegration(supabase)
  if (!integration?.automatic_request_url) {
    throw new Error('Pedido automático não está configurado.')
  }

  const catalog = await fetchProviderCatalog(supabase)
  const selected = catalog.find((item) => item.file === trackFile)
  if (!selected) {
    throw Object.assign(new Error('A música escolhida não está mais disponível no AutoDJ.'), { status: 409 })
  }

  const providerResponse = await fetchProvider(integration.automatic_request_url, {
    method: 'POST',
    headers: {
      Accept: 'text/plain, text/html, */*',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({
      musica: selected.file,
      nome: cleanText(requesterName, 40),
      email: '',
    }).toString(),
  })

  if (!providerResponse.ok) {
    throw new Error(`AutoDJ respondeu HTTP ${providerResponse.status}`)
  }

  const result = cleanText(await providerResponse.text(), 120)
  if (!result || result.toLocaleLowerCase('pt-BR') === 'erro') {
    throw Object.assign(
      new Error('O AutoDJ recusou o pedido neste momento. Aguarde alguns minutos e tente novamente.'),
      { status: 429 },
    )
  }

  return {
    queued: true,
    provider: integration.provider || 'vox-svrdedicado',
    estimatedExecution: result,
    track: selected,
  }
}

function getIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) return forwarded[0]?.split(',')[0]?.trim() || ''
  if (forwarded) return String(forwarded).split(',')[0]?.trim()
  return request.socket?.remoteAddress || ''
}

function getUserAgent(request) {
  return cleanText(request.headers['user-agent'] || '', 500)
}

function createFingerprint(request, userId = '') {
  return crypto
    .createHash('sha256')
    .update(`${userId}|${getIp(request)}|${getUserAgent(request)}`)
    .digest('hex')
}

function getBearerToken(request) {
  const header = request.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

function isAuthorizedRadioUser(user) {
  const role = user?.app_metadata?.role
  return AUTHORIZED_ROLES.has(role) || user?.app_metadata?.is_admin === true
}

async function getOptionalUser(request, supabase) {
  const token = getBearerToken(request)

  if (!token) {
    return { ok: true, user: null }
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    return { ok: false, status: 401, error: 'Sua sessao expirou. Atualize a pagina ou entre novamente.' }
  }

  return { ok: true, user: data.user }
}

async function requireAdmin(request, supabase) {
  const token = getBearerToken(request)

  if (!token) {
    return { ok: false, status: 401, error: 'Autenticacao administrativa obrigatoria.' }
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !isAuthorizedRadioUser(data?.user)) {
    return { ok: false, status: 403, error: 'Acesso administrativo negado.' }
  }

  return { ok: true, user: data.user }
}

async function getRequesterIdentity(supabase, user, guestName = '') {
  if (user?.id) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error

    const username = cleanText(profile?.username, 40)
    const displayName = cleanText(profile?.display_name, 80)
    const requesterName = username || displayName || 'Usuário IMORTAL0800'

    return {
      requesterProfileId: user.id,
      requesterName,
      requesterKind: 'user',
    }
  }

  const requesterName = cleanText(guestName, 40)
  if (requesterName.length < 2) {
    throw Object.assign(new Error('Informe seu nome para enviar como visitante.'), { status: 400 })
  }

  return {
    requesterProfileId: null,
    requesterName,
    requesterKind: 'guest',
  }
}

async function readBody(request) {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body)
    } catch {
      return {}
    }
  }
  return {}
}

async function getLocutorDisplayName(supabase, user) {
  if (!user?.id) return 'Locutor'

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error

  return cleanText(
    data?.display_name
      || data?.username
      || user?.app_metadata?.username
      || user?.user_metadata?.username
      || 'Locutor',
    80,
  )
}


function normalizeProgram(row = {}) {
  return {
    id: row.id,
    title: cleanText(row.title, 80),
    description: cleanText(row.description, 300),
    locutorName: cleanText(row.locutor_name, 80),
    daysLabel: cleanText(row.days_label, 100),
    timeLabel: cleanText(row.time_label, 80),
    imageUrl: cleanText(row.image_url, 500),
    enabled: row.enabled !== false,
    displayOrder: Number(row.display_order) || 0,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }
}

function normalizeSchedule(row = {}) {
  return {
    dayOfWeek: Number(row.day_of_week) || 0,
    dayLabel: cleanText(row.day_label, 30),
    locutorName: cleanText(row.locutor_name, 80),
    timeLabel: cleanText(row.time_label, 80),
    enabled: row.enabled !== false,
    updatedAt: row.updated_at || null,
  }
}

async function handlePublicContentGet(response, supabase) {
  const [programResult, scheduleResult, statusResult, requestResult] = await Promise.all([
    supabase
      .from(PROGRAMS_TABLE)
      .select('id,title,description,locutor_name,days_label,time_label,image_url,enabled,display_order,created_at,updated_at')
      .eq('enabled', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from(SCHEDULE_TABLE)
      .select('day_of_week,day_label,locutor_name,time_label,enabled,updated_at')
      .eq('enabled', true)
      .order('day_of_week', { ascending: true }),
    supabase
      .from(LOCUTOR_STATUS_TABLE)
      .select('is_live,locutor_name,updated_at')
      .eq('id', 'imortal0800')
      .maybeSingle(),
    supabase
      .from(TABLE)
      .select('song_and_artist,created_at')
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  if (programResult.error) throw programResult.error
  if (scheduleResult.error) throw scheduleResult.error
  if (statusResult.error) throw statusResult.error
  if (requestResult.error) throw requestResult.error

  const rankingMap = new Map()
  for (const row of requestResult.data || []) {
    const label = cleanText(row.song_and_artist, 180)
    if (!label) continue
    const key = label.toLocaleLowerCase('pt-BR')
    const current = rankingMap.get(key) || { label, count: 0, lastRequestedAt: row.created_at || null }
    current.count += 1
    rankingMap.set(key, current)
  }

  const ranking = Array.from(rankingMap.values())
    .sort((a, b) => b.count - a.count || String(b.lastRequestedAt || '').localeCompare(String(a.lastRequestedAt || '')))
    .slice(0, 5)

  response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
  response.status(200).json({
    ok: true,
    data: {
      programs: (programResult.data || []).map(normalizeProgram),
      schedule: (scheduleResult.data || []).map(normalizeSchedule),
      ranking,
      locutorStatus: {
        isLive: Boolean(statusResult.data?.is_live),
        locutorName: cleanText(statusResult.data?.locutor_name, 80),
        updatedAt: statusResult.data?.updated_at || null,
      },
    },
  })
}

async function handleProgramsGet(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const { data, error } = await supabase
    .from(PROGRAMS_TABLE)
    .select('id,title,description,locutor_name,days_label,time_label,image_url,enabled,display_order,created_at,updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  response.status(200).json({ ok: true, data: (data || []).map(normalizeProgram) })
}

async function handleScheduleGet(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .select('day_of_week,day_label,locutor_name,time_label,enabled,updated_at')
    .order('day_of_week', { ascending: true })

  if (error) throw error
  response.status(200).json({ ok: true, data: (data || []).map(normalizeSchedule) })
}

async function handleProgramPost(request, response, supabase, body) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const title = cleanText(body.title, 80)
  if (title.length < 2) {
    response.status(400).json({ ok: false, error: 'Informe o nome do programa.' })
    return
  }

  const payload = {
    title,
    description: cleanText(body.description, 300) || null,
    locutor_name: cleanText(body.locutorName, 80) || null,
    days_label: cleanText(body.daysLabel, 100) || null,
    time_label: cleanText(body.timeLabel, 80) || null,
    image_url: cleanText(body.imageUrl, 500) || null,
    enabled: body.enabled !== false,
    display_order: Math.max(0, Number.parseInt(body.displayOrder, 10) || 0),
    updated_by: admin.user?.id || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from(PROGRAMS_TABLE)
    .insert(payload)
    .select('id,title,description,locutor_name,days_label,time_label,image_url,enabled,display_order,created_at,updated_at')
    .single()

  if (error) throw error
  response.status(201).json({ ok: true, data: normalizeProgram(data) })
}

async function handleProgramPatch(request, response, supabase, admin, body) {
  const id = cleanText(body.id, 80)
  const title = cleanText(body.title, 80)
  if (!id || title.length < 2) {
    response.status(400).json({ ok: false, error: 'Programa inválido.' })
    return
  }

  const payload = {
    title,
    description: cleanText(body.description, 300) || null,
    locutor_name: cleanText(body.locutorName, 80) || null,
    days_label: cleanText(body.daysLabel, 100) || null,
    time_label: cleanText(body.timeLabel, 80) || null,
    image_url: cleanText(body.imageUrl, 500) || null,
    enabled: body.enabled !== false,
    display_order: Math.max(0, Number.parseInt(body.displayOrder, 10) || 0),
    updated_by: admin.user?.id || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from(PROGRAMS_TABLE)
    .update(payload)
    .eq('id', id)
    .select('id,title,description,locutor_name,days_label,time_label,image_url,enabled,display_order,created_at,updated_at')
    .single()

  if (error) throw error
  response.status(200).json({ ok: true, data: normalizeProgram(data) })
}

async function handleSchedulePatch(response, supabase, admin, body) {
  const dayOfWeek = Number.parseInt(body.dayOfWeek, 10)
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    response.status(400).json({ ok: false, error: 'Dia da semana inválido.' })
    return
  }

  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .update({
      locutor_name: cleanText(body.locutorName, 80),
      time_label: cleanText(body.timeLabel, 80),
      enabled: body.enabled !== false,
      updated_by: admin.user?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('day_of_week', dayOfWeek)
    .select('day_of_week,day_label,locutor_name,time_label,enabled,updated_at')
    .single()

  if (error) throw error
  response.status(200).json({ ok: true, data: normalizeSchedule(data) })
}

async function handleProgramDelete(response, supabase, id) {
  if (!id) {
    response.status(400).json({ ok: false, error: 'Programa não informado.' })
    return
  }

  const { error } = await supabase
    .from(PROGRAMS_TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
  response.status(200).json({ ok: true, data: { id, deleted: true } })
}

async function handleLocutorStatusGet(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const { data, error } = await supabase
    .from(LOCUTOR_STATUS_TABLE)
    .select('id,is_live,locutor_name,updated_at')
    .eq('id', 'imortal0800')
    .maybeSingle()

  if (error) throw error

  response.status(200).json({
    ok: true,
    data: {
      isLive: Boolean(data?.is_live),
      locutorName: cleanText(data?.locutor_name, 80),
      updatedAt: data?.updated_at || null,
    },
  })
}

async function handleLocutorStatusPatch(request, response, supabase, admin, body) {
  const isLive = Boolean(body.isLive)
  const locutorName = isLive
    ? await getLocutorDisplayName(supabase, admin.user)
    : ''

  const { data, error } = await supabase
    .from(LOCUTOR_STATUS_TABLE)
    .upsert({
      id: 'imortal0800',
      is_live: isLive,
      locutor_name: locutorName,
      updated_by: admin.user?.id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('id,is_live,locutor_name,updated_at')
    .single()

  if (error) throw error

  response.status(200).json({
    ok: true,
    data: {
      isLive: Boolean(data?.is_live),
      locutorName: cleanText(data?.locutor_name, 80),
      updatedAt: data?.updated_at || null,
    },
  })
}

async function handlePost(request, response, supabase) {
  const body = await readBody(request)

  if (body.resource === 'program') {
    await handleProgramPost(request, response, supabase, body)
    return
  }

  const requester = await getOptionalUser(request, supabase)
  if (!requester.ok) {
    response.status(requester.status).json({ ok: false, error: requester.error })
    return
  }

  const songAndArtist = cleanText(body.songAndArtist, 180)
  const message = cleanText(body.message, 500)
  const identity = await getRequesterIdentity(supabase, requester.user, body.requesterName)

  if (songAndArtist.length < 3) {
    response.status(400).json({
      ok: false,
      error: 'Informe a musica e o artista com pelo menos 3 caracteres.',
    })
    return
  }

  const fingerprint = createFingerprint(request, requester.user?.id || '')
  const since = new Date(Date.now() - REQUEST_WINDOW_SECONDS * 1000).toISOString()

  const { data: recent, error: recentError } = await supabase
    .from(TABLE)
    .select('id, created_at')
    .eq('request_fingerprint', fingerprint)
    .gte('created_at', since)
    .limit(1)

  if (recentError) {
    throw recentError
  }

  if (recent?.length) {
    response.status(429).json({
      ok: false,
      error: 'Aguarde um pouco antes de enviar outro pedido.',
    })
    return
  }

  const { data: locutorStatus, error: locutorStatusError } = await supabase
    .from(LOCUTOR_STATUS_TABLE)
    .select('is_live,locutor_name')
    .eq('id', 'imortal0800')
    .maybeSingle()

  if (locutorStatusError) throw locutorStatusError

  const locutorLive = Boolean(locutorStatus?.is_live)
  const providerTrackFile = cleanText(body.providerTrackFile, 240)
  let automaticDelivery = null
  let automaticError = ''

  if (!locutorLive && providerTrackFile) {
    try {
      automaticDelivery = await sendAutomaticProviderRequest(supabase, {
        trackFile: providerTrackFile,
        requesterName: identity.requesterName,
      })
    } catch (error) {
      automaticError = cleanText(error?.message, 240)
    }
  }

  const sourceBase = requester.user ? 'authenticated_radio_page' : 'public_radio_page'
  const source = automaticDelivery?.queued
    ? `${sourceBase}_autodj`
    : locutorLive
      ? `${sourceBase}_live_manual`
      : sourceBase

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      song_and_artist: automaticDelivery?.track?.label || songAndArtist,
      message: message || null,
      status: automaticDelivery?.queued ? 'read' : 'pending',
      source,
      request_fingerprint: fingerprint,
      requester_user_agent: getUserAgent(request) || null,
      requester_profile_id: identity.requesterProfileId,
      requester_name: identity.requesterName,
      requester_kind: identity.requesterKind,
      admin_note: automaticDelivery?.queued
        ? `AutoDJ: execução estimada ${automaticDelivery.estimatedExecution}`
        : automaticError
          ? `AutoDJ indisponível: ${automaticError}`
          : null,
      handled_by: automaticDelivery?.queued ? 'vox-autodj' : null,
    })
    .select('id, status')
    .single()

  if (error) {
    throw error
  }

  response.status(201).json({
    ok: true,
    data: {
      ...data,
      deliveryMode: automaticDelivery?.queued ? 'automatic' : 'manual',
      locutorLive,
      locutorName: cleanText(locutorStatus?.locutor_name, 80),
      providerQueued: Boolean(automaticDelivery?.queued),
      estimatedExecution: automaticDelivery?.estimatedExecution || '',
      automaticError,
    },
  })
}

async function handleGet(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const status = cleanText(request.query?.status, 30)
  let query = supabase
    .from(TABLE)
    .select('id, song_and_artist, message, status, source, requester_profile_id, requester_name, requester_kind, admin_note, handled_by, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && VALID_STATUSES.has(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  response.status(200).json({
    ok: true,
    data: data || [],
  })
}

async function handlePatch(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const body = await readBody(request)

  if (body.resource === 'locutor-status') {
    await handleLocutorStatusPatch(request, response, supabase, admin, body)
    return
  }

  if (body.resource === 'program') {
    await handleProgramPatch(request, response, supabase, admin, body)
    return
  }

  if (body.resource === 'schedule') {
    await handleSchedulePatch(response, supabase, admin, body)
    return
  }

  const id = cleanText(body.id, 80)
  const status = cleanText(body.status, 30)

  if (!id || status !== 'read') {
    response.status(400).json({
      ok: false,
      error: 'Pedido ou status invalido.',
    })
    return
  }

  const payload = {
    status,
    admin_note: cleanText(body.adminNote, 500) || null,
    handled_by: cleanText(body.handledBy, 120) || admin.user?.email || admin.user?.id || null,
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select('id, song_and_artist, message, status, source, requester_profile_id, requester_name, requester_kind, admin_note, handled_by, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  response.status(200).json({
    ok: true,
    data,
  })
}

async function handleDelete(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const body = await readBody(request)
  const id = cleanText(request.query?.id || body.id, 80)

  if (body.resource === 'program' || cleanText(request.query?.section, 40) === 'programs') {
    await handleProgramDelete(response, supabase, id)
    return
  }

  if (!id) {
    response.status(400).json({ ok: false, error: 'Pedido nao informado.' })
    return
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  response.status(200).json({
    ok: true,
    data: { id, deleted: true },
  })
}

export default async function handler(request, response) {
  if (!applyApiCors(request, response, {
    methods: 'GET, POST, PATCH, DELETE, OPTIONS',
    headers: 'Content-Type, Authorization',
  })) {
    response.status(403).json({ ok: false, error: 'Origin not allowed.' })
    return
  }

  response.setHeader('Cache-Control', 'private, no-store, max-age=0')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (['POST', 'PATCH', 'DELETE'].includes(request.method)
      && rejectOversizedBody(request, response, 8 * 1024)) {
    return
  }

  try {
    const supabase = getSupabaseAdmin()

    if (request.method === 'POST') {
      await handlePost(request, response, supabase)
      return
    }

    if (request.method === 'GET') {
      const section = cleanText(request.query?.section, 40)

      if (section === 'public-content') {
        await handlePublicContentGet(response, supabase)
        return
      }

      if (section === 'provider-catalog') {
        await handleProviderCatalogGet(request, response, supabase)
        return
      }


      if (section === 'locutor-status') {
        await handleLocutorStatusGet(request, response, supabase)
        return
      }

      if (section === 'programs') {
        await handleProgramsGet(request, response, supabase)
        return
      }

      if (section === 'schedule') {
        await handleScheduleGet(request, response, supabase)
        return
      }

      await handleGet(request, response, supabase)
      return
    }

    if (request.method === 'PATCH') {
      await handlePatch(request, response, supabase)
      return
    }

    if (request.method === 'DELETE') {
      await handleDelete(request, response, supabase)
      return
    }

    response.status(405).json({
      ok: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error('Radio music request API error:', error.message)
    response.status(error.status || 500).json({
      ok: false,
      error: error.message || 'Não foi possível processar o pedido agora.',
    })
  }
}
