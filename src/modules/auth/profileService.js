import { getSupabaseClient } from '../../core/database'

const PROFILE_FIELDS = 'id, display_name, username, avatar_url, bio, role, status, preferences, created_at, updated_at'
const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

function getClient() {
  const client = getSupabaseClient()
  if (!client) throw new Error('O Supabase nao esta configurado neste ambiente.')
  return client
}

function fallbackDisplayName(user) {
  const metadataName = String(user?.user_metadata?.display_name || user?.user_metadata?.name || '').trim()
  if (metadataName) return metadataName

  const email = String(user?.email || '')
  return email.includes('@') ? email.split('@')[0] : 'Amigo do Bar'
}

function mapProfile(row, user) {
  if (!row) {
    return {
      id: user?.id || '',
      displayName: fallbackDisplayName(user),
      username: '',
      avatarUrl: '',
      bio: '',
      role: 'user',
      status: 'active',
      preferences: {},
      createdAt: '',
      updatedAt: '',
      isFallback: true,
    }
  }

  return {
    id: row.id,
    displayName: row.display_name || fallbackDisplayName(user),
    username: row.username || '',
    avatarUrl: row.avatar_url || '',
    bio: row.bio || '',
    role: row.role || 'user',
    status: row.status || 'active',
    preferences: row.preferences || {},
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    isFallback: false,
  }
}

function handleProfileError(error) {
  if (error?.code === '23505') {
    throw new Error('Esse nome de usuario ja esta em uso. Escolha outro.')
  }
  throw error
}

async function getAccessToken(client) {
  const { data, error } = await client.auth.getSession()
  if (error) throw error

  const token = data?.session?.access_token || ''
  if (!token) throw new Error('Sua sessao expirou. Entre novamente para continuar.')
  return token
}

async function bootstrapProfile(client, user) {
  const token = await getAccessToken(client)
  const response = await fetch('/api/profile', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || 'Nao foi possivel preparar seu perfil agora.')
  }

  return mapProfile(payload?.data, user)
}

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

export function validateUsername(value) {
  const username = normalizeUsername(value)
  if (!username) return ''

  if (username.length < 3 || username.length > 24) {
    throw new Error('O nome de usuario deve ter entre 3 e 24 caracteres.')
  }

  if (!/^[a-z0-9._]+$/.test(username)) {
    throw new Error('Use apenas letras, numeros, ponto e underline no nome de usuario.')
  }

  return username
}

export async function loadUserProfile(user) {
  if (!user?.id) return null
  const client = getClient()

  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (data) return mapProfile(data, user)

  return bootstrapProfile(client, user)
}

async function updateExistingProfile(client, user, payload) {
  const { data, error } = await client
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select(PROFILE_FIELDS)
    .maybeSingle()

  if (error) handleProfileError(error)
  return data ? mapProfile(data, user) : null
}

export async function saveUserProfile(user, values = {}) {
  if (!user?.id) throw new Error('Entre na sua conta para editar o perfil.')
  const client = getClient()

  const displayName = String(values.displayName || '').trim()
  const username = validateUsername(values.username)
  const bio = String(values.bio || '').trim().slice(0, 280)

  if (displayName.length < 2 || displayName.length > 60) {
    throw new Error('O nome exibido deve ter entre 2 e 60 caracteres.')
  }

  const payload = {
    display_name: displayName,
    username: username || null,
    bio: bio || null,
  }

  if (values.avatarUrl !== undefined) {
    payload.avatar_url = String(values.avatarUrl || '').trim() || null
  }

  const updated = await updateExistingProfile(client, user, payload)
  if (updated) return updated

  await bootstrapProfile(client, user)
  const retried = await updateExistingProfile(client, user, payload)
  if (!retried) throw new Error('Nao foi possivel salvar seu perfil agora.')
  return retried
}

function getAvatarExtension(file) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function uploadUserAvatar(user, file) {
  if (!user?.id) throw new Error('Entre na sua conta para alterar a foto.')
  if (!file) throw new Error('Selecione uma imagem para o perfil.')
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) throw new Error('Use uma imagem PNG, JPG ou WebP.')
  if (file.size > MAX_AVATAR_SIZE) throw new Error('A imagem deve ter no maximo 5 MB.')

  const client = getClient()
  const extension = getAvatarExtension(file)
  const filePath = `${user.id}/avatar-${Date.now()}.${extension}`

  const { error: uploadError } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) throw uploadError

  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
  const avatarUrl = data?.publicUrl || ''
  if (!avatarUrl) throw new Error('Nao foi possivel gerar a URL publica do avatar.')

  return {
    avatarUrl,
    path: filePath,
  }
}
