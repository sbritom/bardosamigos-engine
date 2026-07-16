/* global process */
import { Buffer } from 'node:buffer'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const EVENT_SELECT_FIELDS = [
  'id',
  'title',
  'slug',
  'description',
  'location',
  'starts_at',
  'ends_at',
  'status',
  'capacity',
  'metadata',
  'created_at',
  'updated_at',
  'deleted_at',
  'version',
].join(',')

let supabaseAdmin

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin environment is not configured.')
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdmin
}

function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function getBearerToken(request) {
  const header = request.headers.authorization || request.headers.Authorization || ''
  const match = String(header).match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}

function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin' || user?.app_metadata?.is_admin === true
}

async function requireAdminUser(request, supabase) {
  const token = getBearerToken(request)

  if (!token) {
    return { user: null, error: 'Token administrativo ausente.', status: 401 }
  }

  const { data, error } = await supabase.auth.getUser(token)
  const user = data?.user || null

  if (error || !user) {
    return { user: null, error: 'Sessao administrativa invalida.', status: 401 }
  }

  if (!isAdminUser(user)) {
    return { user: null, error: 'Acesso restrito a administradores.', status: 403 }
  }

  return { user, error: null, status: 200 }
}

function cleanText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength)
}

function slugify(value) {
  return cleanText(value, 120)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

async function readBody(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body
  }

  const chunks = []

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk))
  }

  if (!chunks.length) return {}

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function assertAllowedFields(body = {}) {
  const allowedFields = new Set([
    'title',
    'description',
    'type',
    'recurring',
    'recurrence',
    'startsAt',
    'endsAt',
    'timeMode',
    'time',
    'location',
    'participationRule',
    'featured',
    'status',
  ])

  const unexpectedFields = Object.keys(body).filter((field) => !allowedFields.has(field))

  if (unexpectedFields.length) {
    return `Campos nao permitidos: ${unexpectedFields.join(', ')}.`
  }

  return ''
}

function toEventDate(value, time) {
  const date = cleanText(value, 20)

  if (!date) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null

  const timeValue = cleanText(time, 8)
  const safeTime = /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : '12:00'
  const parsed = new Date(`${date}T${safeTime}:00-03:00`)

  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toISOString()
}

function buildMetadata({ body, type, recurring, timeLabel }) {
  const metadata = {
    type,
    recurring,
  }

  const recurrence = cleanText(body.recurrence, 80)
  const participationRule = cleanText(body.participationRule, 1000)

  if (recurring && recurrence) metadata.recurrence = recurrence
  if (body.featured === true) metadata.featured = true
  if (timeLabel) metadata.timeLabel = timeLabel
  if (participationRule) metadata.participationRule = participationRule

  return metadata
}

function validateCreateEventPayload(body = {}) {
  const unexpectedFieldsError = assertAllowedFields(body)
  if (unexpectedFieldsError) return { error: unexpectedFieldsError }

  const allowedTypes = new Set(['Bingo', 'Brincadeira', 'Campeonato', 'Especial', 'Musica ao Vivo', 'Promocao', 'Outro'])
  const allowedRecurrences = new Set(['Toda segunda-feira', 'Toda sexta-feira', 'Todo sabado', 'Mensal', 'Personalizado'])
  const allowedStatuses = new Set(['published', 'draft'])
  const allowedTimeModes = new Set(['announced', 'specific'])

  const title = cleanText(body.title, 160)
  const description = cleanText(body.description, 3000)
  const slug = slugify(title)
  const type = cleanText(body.type, 80) || 'Outro'
  const recurring = body.recurring === true
  const status = cleanText(body.status, 20) || 'draft'
  const timeMode = cleanText(body.timeMode, 20) || 'announced'
  const time = cleanText(body.time, 8)

  if (!title) return { error: 'Informe o titulo do evento.' }
  if (!description) return { error: 'Informe a descricao do evento.' }
  if (!slug) return { error: 'Nao foi possivel gerar o slug do evento.' }
  if (!allowedTypes.has(type)) return { error: 'Tipo de evento invalido.' }
  if (!allowedStatuses.has(status)) return { error: 'Status de evento invalido.' }
  if (!allowedTimeModes.has(timeMode)) return { error: 'Opcao de horario invalida.' }
  if (timeMode === 'specific' && !/^\d{2}:\d{2}$/.test(time)) return { error: 'Informe um horario especifico valido.' }

  if (recurring) {
    const recurrence = cleanText(body.recurrence, 80)
    if (!allowedRecurrences.has(recurrence)) return { error: 'Frequencia invalida para evento recorrente.' }
  }

  const startsAt = recurring ? null : toEventDate(body.startsAt, timeMode === 'specific' ? time : '')
  const endsAt = recurring || !body.endsAt ? null : toEventDate(body.endsAt, timeMode === 'specific' ? time : '')

  if (!recurring && !startsAt) return { error: 'Informe a data inicial do evento.' }

  const timeLabel = timeMode === 'specific' ? time : 'Horario divulgado no dia'

  return {
    event: {
      title,
      slug,
      description,
      location: cleanText(body.location, 240) || null,
      starts_at: startsAt,
      ends_at: endsAt,
      status,
      metadata: buildMetadata({ body, type, recurring, timeLabel }),
    },
  }
}

async function listEvents(supabase) {
  return supabase
    .from('events')
    .select(EVENT_SELECT_FIELDS)
    .order('created_at', { ascending: false })
}

async function createEvent(request, response, supabase) {
  let body

  try {
    body = await readBody(request)
  } catch {
    response.status(400).json({ ok: false, error: 'JSON invalido.' })
    return
  }

  const validation = validateCreateEventPayload(body)

  if (validation.error) {
    response.status(400).json({ ok: false, error: validation.error })
    return
  }

  const { event } = validation

  const { data: existingEvent, error: slugError } = await supabase
    .from('events')
    .select('id')
    .eq('slug', event.slug)
    .maybeSingle()

  if (slugError) {
    response.status(500).json({ ok: false, error: 'Nao foi possivel validar o slug do evento.' })
    return
  }

  if (existingEvent) {
    response.status(409).json({ ok: false, error: 'Ja existe um evento com este slug.' })
    return
  }

  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select(EVENT_SELECT_FIELDS)
    .single()

  if (error) {
    response.status(500).json({ ok: false, error: 'Nao foi possivel criar o evento.' })
    return
  }

  response.status(201).json({ ok: true, data })
}

export default async function handler(request, response) {
  setCors(response)

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, OPTIONS')
    response.status(405).json({ ok: false, error: 'Metodo nao permitido.' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const access = await requireAdminUser(request, supabase)

    if (!access.user) {
      response.status(access.status).json({ ok: false, error: access.error })
      return
    }

    if (request.method === 'POST') {
      await createEvent(request, response, supabase)
      return
    }

    const { data, error } = await listEvents(supabase)

    if (error) {
      response.status(500).json({ ok: false, error: 'Nao foi possivel listar os eventos.' })
      return
    }

    response.status(200).json({
      ok: true,
      data: data || [],
    })
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error?.message || 'Erro inesperado ao listar eventos.',
    })
  }
}
