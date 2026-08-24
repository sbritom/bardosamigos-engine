import { useCallback, useEffect, useState } from 'react'
import { LogIn, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react'

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

function AdminAccessShell({ children }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 md:py-16">
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8">
        {children}
      </section>
    </main>
  )
}

export default function AdminRouteGuard({
  children,
  allowedRoles = [ADMIN_ROLES.ADMIN],
  title = 'Area administrativa',
}) {
  const [access, setAccess] = useState(INITIAL_STATE)
  const [form, setForm] = useState({ username: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [loginError, setLoginError] = useState('')

  const refreshAccess = useCallback(async () => {
    setAccess((current) => ({ ...current, loading: true }))
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

    getAdminAccess({ allowedRoles })
      .then((result) => {
        if (active) setAccess({ loading: false, ...result })
      })
      .catch((error) => {
        if (active) {
          setAccess({
            ...INITIAL_STATE,
            loading: false,
            reason: error.message || ADMIN_AUTH_ERRORS.NOT_ALLOWED,
          })
        }
      })

    return () => {
      active = false
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
      <AdminAccessShell>
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <ShieldCheck size={24} className="text-[var(--primary)]" />
          <div>
            <strong className="block text-[var(--text)]">Verificando acesso</strong>
            <span className="text-sm">Validando sua sessao administrativa...</span>
          </div>
        </div>
      </AdminAccessShell>
    )
  }

  if (!access.hasSession) {
    return (
      <AdminAccessShell>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <ShieldCheck size={24} />
          </span>
          <div>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">Acesso restrito</span>
            <h1 className="mt-1 text-2xl font-black text-[var(--text)]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Entre com uma conta autorizada. O acesso e validado antes de carregar o modulo administrativo.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
          <label className="text-sm font-bold text-[var(--text)]">
            Usuario
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
          </label>

          <label className="text-sm font-bold text-[var(--text)]">
            Senha
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/10 px-4 py-3 font-normal text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          {(loginError || access.reason) && (
            <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-100">
              {loginError || access.reason}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
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
      <AdminAccessShell>
        <ShieldAlert size={30} className="text-amber-300" />
        <h1 className="mt-3 text-2xl font-black text-[var(--text)]">Acesso nao autorizado</h1>
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
