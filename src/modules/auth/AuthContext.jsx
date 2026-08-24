import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { getSupabaseClient } from '../../core/database'
import { loadUserProfile, saveUserProfile, uploadUserAvatar } from './profileService'

const AuthContext = createContext(null)

function getMetadataDisplayName(user) {
  return String(user?.user_metadata?.display_name || user?.user_metadata?.name || '').trim()
}

function getFallbackDisplayName(user) {
  const metadataName = getMetadataDisplayName(user)
  if (metadataName) return metadataName

  const email = String(user?.email || '')
  return email.includes('@') ? email.split('@')[0] : 'Amigo do Bar'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
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

  const refreshProfile = useCallback(async (userOverride) => {
    const currentUser = userOverride || session?.user
    if (!currentUser?.id) {
      setProfile(null)
      setProfileError('')
      setProfileLoading(false)
      return null
    }

    setProfileLoading(true)
    setProfileError('')

    try {
      const nextProfile = await loadUserProfile(currentUser)
      setProfile(nextProfile)
      return nextProfile
    } catch (error) {
      setProfile(null)
      setProfileError(error.message || 'Nao foi possivel carregar seu perfil.')
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      setProfileError('')
      setProfileLoading(false)
      return
    }

    refreshProfile(session.user)
  }, [refreshProfile, session?.user])

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

  const updateProfile = useCallback(async (values) => {
    const supabase = getSupabaseClient()
    const user = session?.user
    if (!supabase || !user) throw new Error('Entre na sua conta para editar o perfil.')

    const nextProfile = await saveUserProfile(user, values)
    setProfile(nextProfile)

    if (nextProfile.displayName && nextProfile.displayName !== getMetadataDisplayName(user)) {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: nextProfile.displayName },
      })
      if (error) console.warn('Nao foi possivel sincronizar o nome no Auth:', error.message)
    }

    return nextProfile
  }, [session?.user])

  const uploadAvatar = useCallback(async (file) => {
    const user = session?.user
    if (!user) throw new Error('Entre na sua conta para alterar a foto.')

    const uploaded = await uploadUserAvatar(user, file)
    const nextProfile = await saveUserProfile(user, {
      displayName: profile?.displayName || getFallbackDisplayName(user),
      username: profile?.username || '',
      bio: profile?.bio || '',
      avatarUrl: uploaded.avatarUrl,
    })

    setProfile(nextProfile)
    return nextProfile
  }, [profile, session?.user])

  const displayName = profile?.displayName || getFallbackDisplayName(session?.user)

  const value = useMemo(() => ({
    user: session?.user || null,
    session,
    loading,
    isAuthenticated: Boolean(session?.user),
    displayName,
    profile,
    profileLoading,
    profileError,
    authDialog,
    setAuthDialog,
    openAuth,
    closeAuth,
    requireAuth,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile,
    uploadAvatar,
  }), [authDialog, closeAuth, displayName, loading, openAuth, profile, profileError, profileLoading, refreshProfile, requireAuth, session, signIn, signOut, signUp, updateProfile, uploadAvatar])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
