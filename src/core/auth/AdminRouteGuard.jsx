import { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, LogIn, LogOut, ShieldAlert, ShieldCheck, User } from 'lucide-react'

import { getSupabaseClient } from '../database/client/supabaseClient.js'
import './adminRouteGuard.css'
import {
  ADMIN_AUTH_ERRORS,
  ADMIN_ROLES,
  getAdminAccess,
  signInAdminWithUsername,
  signOutAdmin,
} from './adminAuthService.js'

const INITIAL_STATE = {
  loading: true,
  allowed: false,
  hasSession: false,
  reason: '',
  user: null,
  role: '',
}

function AdminAccessShell({ children, centered = false }) {
  return (
    <main
      className={[
        'mx-auto w-full max-w-xl px-4 py-10 md:py-16',
        'admin-access-shell',
        centered ? 'admin-access-shell--centered' : '',
      ].filter(Boolean).join(' ')}
      style={centered ? {
        width: '100%',
        maxWidth: 'none',
        minHeight: 'calc(100dvh - 210px)',
        margin: '0 auto',
        padding: '32px 16px',
        boxSizing: 'border-box',
        display: 'grid',
        placeItems: 'center',
      } : undefined}
    >
      <section
        className={[
          'rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8',
          'admin-access-card',
          centered ? 'admin-access-card--centered' : '',
        ].filter(Boolean).join(' ')}
        style={centered ? {
          width: 'min(100%, 390px)',
          margin: '0 auto',
          boxSizing: 'border-box',
        } : undefined}
      >
        {children}
      </section>
    </main>
  )
}

export default function AdminRouteGuard({
  children,
  allowedRoles = [ADMIN_ROLES.ADMIN],
  title = 'Área administrativa',
  centeredAuth = false,
}) {
  const [access, setAccess] = useState(INITIAL_STATE)
  const [form, setForm] = useState({ username: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const refreshAccess = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setAccess((current) => ({ ...current, loading: true }))

    try {
      const result = await getAdminAccess({ allowedRoles })
      setAccess({ loading: false, ...result })
      return result
    } catch (error) {
      setAccess({
        ...INITIAL_STATE,
        loading: false,
        reason: error.message || ADMIN_AUTH_ERRORS.NOT_ALLOWED,
      })
      return null
    }
  }, [allowedRoles])

  useEffect(() => {
    let active = true
    const client = getSupabaseClient()

    const verify = async (showLoading = true) => {
      if (showLoading && active) setAccess((current) => ({ ...current, loading: true }))

      try {
        const result = await getAdminAccess({ allowedRoles })
        if (active) setAccess({ loading: false, ...result })
      } catch (error) {
        if (active) {
          setAccess({
            ...INITIAL_STATE,
            loading: false,
            reason: error.message || ADMIN_AUTH_ERRORS.NOT_ALLOWED,
          })
        }
      }
    }

    verify(true)

    const { data: authSubscription } = client?.auth.onAuthStateChange(() => {
      // Revalidate against Supabase instead of trusting the session event payload.
      window.setTimeout(() => verify(false), 0)
    }) || { data: null }

    return () => {
      active = false
      authSubscription?.subscription?.unsubscribe()
    }
  }, [allowedRoles])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleLogin(event) {
    event.preventDefault()
    setBusy(true)
    setLoginError('')

    try {
      const result = await signInAdminWithUsername({
        ...form,
        allowedRoles,
        allowLegacyUserMetadata: false,
      })
      setAccess({ loading: false, ...result })
      setForm({ username: '', password: '' })
    } catch (error) {
      setLoginError(error.message || ADMIN_AUTH_ERRORS.INVALID_LOGIN)
      await refreshAccess()
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setBusy(true)
    setLoginError('')
    try {
      await signOutAdmin()
      setAccess({ ...INITIAL_STATE, loading: false })
      setForm({ username: '', password: '' })
    } finally {
      setBusy(false)
    }
  }

  if (access.loading) {
    return (
      <AdminAccessShell centered={centeredAuth}>
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <ShieldCheck size={24} className="text-[var(--primary)]" />
          <div>
            <strong className="block text-[var(--text)]">Verificando acesso</strong>
            <span className="text-sm">Validando sua sessão administrativa...</span>
          </div>
        </div>
      </AdminAccessShell>
    )
  }

  if (!access.hasSession) {
    return (
      <AdminAccessShell centered={centeredAuth}>
        <div className={centeredAuth ? 'admin-access-card__header' : 'flex items-start gap-3'}>
          <span className={centeredAuth ? 'admin-access-card__icon' : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]'}>
            <ShieldCheck size={24} />
          </span>
          <div>
            <span className={centeredAuth ? 'admin-access-card__eyebrow' : 'text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]'}>Acesso restrito</span>
            <h1 className={centeredAuth ? 'admin-access-card__title' : 'mt-1 text-2xl font-black text-[var(--text)]'}>{title}</h1>
            <p className={centeredAuth ? 'admin-access-card__subtitle' : 'mt-2 text-sm leading-6 text-[var(--text-secondary)]'}>
              Entre com uma conta autorizada. O acesso é validado antes de carregar o módulo administrativo.
            </p>
          </div>
        </div>

        <form className={centeredAuth ? 'admin-access-form' : 'mt-6 grid gap-4'} onSubmit={handleLogin}>
          <label className={centeredAuth ? 'admin-access-field' : 'text-sm font-bold text-[var(--text)]'}>
            <span>Usuário</span>
            {centeredAuth ? (
              <div>
                <User size={16} />
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={32}
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Seu usuário"
                />
              </div>
            ) : (
              <input
                name="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={32}
                value={form.username}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/10 px-4 py-3 font-normal text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
              />
            )}
          </label>

          <label className={centeredAuth ? 'admin-access-field' : 'text-sm font-bold text-[var(--text)]'}>
            <span>Senha</span>
            {centeredAuth ? (
              <div>
                <LockKeyhole size={16} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="admin-access-password-toggle"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            ) : (
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/10 px-4 py-3 font-normal text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
              />
            )}
          </label>

          {(loginError || access.reason) && (
            <p className={centeredAuth ? 'admin-access-feedback' : 'rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-100'}>
              {loginError || access.reason}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className={centeredAuth ? 'admin-access-primary' : 'flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60'}
          >
            <LogIn size={18} />
            {busy ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </AdminAccessShell>
    )
  }

  if (!access.allowed) {
    return (
      <AdminAccessShell centered={centeredAuth}>
        <ShieldAlert size={30} className="text-amber-300" />
        <h1 className="mt-3 text-2xl font-black text-[var(--text)]">Acesso não autorizado</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {access.reason || ADMIN_AUTH_ERRORS.NOT_ALLOWED}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={busy}
          className="mt-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold text-[var(--text)] transition hover:bg-white/10 disabled:opacity-60"
        >
          <LogOut size={18} />
          Sair desta conta
        </button>
      </AdminAccessShell>
    )
  }

  return children
}
