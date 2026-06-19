import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

export function createSupabaseBrowserClient(options = {}) {
  const url = options.url || import.meta.env.VITE_SUPABASE_URL
  const anonKey = options.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    ...options.clientOptions,
  })
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseBrowserClient()
  }

  return supabaseClient
}

export function setSupabaseClient(client) {
  supabaseClient = client
  return supabaseClient
}
