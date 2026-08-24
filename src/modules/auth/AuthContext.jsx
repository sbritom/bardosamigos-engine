import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { getSupabaseClient } from '../../core/database'

const AuthContext = createContext(null)

function getDisplayName(user) {
  return String(user?.user_metadata?.display_name || user?.user_metadata?.name || '').trim()
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authDialog, setAuthDialog] = useState({
    open: false,
    mode: 'login',
    reason: '',
  })

  useEffect(() => {
    const supabase = getSupabaseClient()

    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data?.session || null)
      setLoading(false)
    }).catch(() => {
      if (!mounted) return
      setSession(null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  const openAuth = useCallback((reason = '', mode = 'login') => {
    setAuthDialog({ open: true, mode, reason })
  }, [])

  const closeAuth = useCallback(() => {
    setAuthDialog((current) => ({ ...current, open: false, reason: '' }))
  }, [])

  const requireAuth = useCallback((reason = 'Entre ou crie sua conta para continuar.') => {
    if (session?.user) return true
    openAuth(reason, 'login')
    return false
  }, [openAuth, session?.user])

  const signIn = useCallback(async ({ email, password }) => {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('A autenticacao nao esta configurada neste ambiente.')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password,
    })

    if (error) throw error
    return data
  }, [])

  const signUp = useCallback(async ({ displayName, email, password }) => {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('A autenticacao nao esta configurada neste ambiente.')

    const { data, error } = await supabase.auth.signUp({
      email: String(email || '').trim(),
      password,
      options: {
        data: {
          display_name: String(displayName || '').trim(),
        },
      },
    })

    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const updateProfile = useCallback(async ({ displayName }) => {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('A autenticacao nao esta configurada neste ambiente.')

    const cleanName = String(displayName || '').trim()
    if (cleanName.length < 2) throw new Error('Informe um nome com pelo menos 2 caracteres.')

    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: cleanName },
    })

    if (error) throw error
    return data
  }, [])

  const value = useMemo(() => ({
    user: session?.user || null,
    session,
    loading,
    isAuthenticated: Boolean(session?.user),
    displayName: getDisplayName(session?.user),
    authDialog,
    setAuthDialog,
    openAuth,
    closeAuth,
    requireAuth,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }), [authDialog, closeAuth, loading, openAuth, requireAuth, session, signIn, signOut, signUp, updateProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
