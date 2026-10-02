import { getSupabaseClient } from '../../../../core/database'

const TABLE = 'layout_settings'
const LOCAL_ADMIN_KEY = 'barstudio.designer.localAdmin'

export function isLocalDesignerEnvironment() {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return import.meta.env.DEV || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

export function isLocalAdminEnabled() {
  if (!isLocalDesignerEnvironment()) return false
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(LOCAL_ADMIN_KEY)
  return stored === null ? true : stored === 'true'
}

export function setLocalAdminEnabled(enabled) {
  if (typeof window === 'undefined') return false
  window.localStorage.setItem(LOCAL_ADMIN_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new CustomEvent('barstudio:local-admin-updated', { detail: { enabled } }))
  return enabled
}

export function toggleLocalAdmin() {
  return setLocalAdminEnabled(!isLocalAdminEnabled())
}

export async function getDesignerUserAccess() {
  if (isLocalAdminEnabled()) {
    return {
      allowed: true,
      reason: '',
      mode: 'local-admin',
      user: {
        id: 'local-admin',
        app_metadata: { role: 'admin', is_admin: true },
      },
    }
  }

  const client = getSupabaseClient()
  if (!client) return { allowed: false, reason: 'Supabase nao configurado.' }

  const { data, error } = await client.auth.getUser()
  if (error) return { allowed: false, reason: error.message === 'Auth session missing!' ? 'Acesso restrito a administradores.' : error.message }

  const user = data?.user
  const role = user?.app_metadata?.role
  const isAdmin = role === 'admin' || user?.app_metadata?.is_admin === true

  return {
    allowed: Boolean(isAdmin),
    reason: isAdmin ? '' : 'Acesso restrito a administradores.',
    user,
  }
}

export async function listLayoutSettings({ page = 'home', device = 'desktop', status } = {}) {
  const client = getSupabaseClient()
  if (!client) return { data: [], error: new Error('Supabase nao configurado.') }

  let query = client
    .from(TABLE)
    .select('*')
    .eq('page', page)
    .eq('device', device)
    .is('deleted_at', null)

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  return { data: data || [], error }
}

export async function saveLayoutSetting({ page = 'home', component, device = 'desktop', properties = {}, status = 'draft' }) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: new Error('Supabase nao configurado.') }

  const payload = {
    page,
    component,
    device,
    status,
    properties,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from(TABLE)
    .upsert(payload, { onConflict: 'page,component,device,status' })
    .select('*')
    .single()

  if (!error && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barstudio:designer-layout-updated', { detail: payload }))
  }

  return { data, error }
}

export async function resetLayoutSetting({ page = 'home', component, device = 'desktop', status } = {}) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: new Error('Supabase nao configurado.') }

  let query = client
    .from(TABLE)
    .update({ deleted_at: new Date().toISOString(), status: 'reset' })
    .eq('page', page)
    .eq('component', component)
    .eq('device', device)
    .is('deleted_at', null)

  if (status) query = query.eq('status', status)

  const { data, error } = await query.select('*')

  if (!error && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barstudio:designer-layout-updated', { detail: { page, component, device, status } }))
  }

  return { data: data || [], error }
}
