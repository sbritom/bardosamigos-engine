import { LogIn, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from './AuthContext'

const initialForm = {
  displayName: '',
  email: '',
  password: '',
}

function getAuthErrorMessage(error) {
  const message = String(error?.message || '')

  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.'
  if (/user already registered/i.test(message)) return 'Ja existe uma conta com este e-mail.'
  if (/password/i.test(message) && /characters/i.test(message)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/rate limit/i.test(message)) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  return message || 'Nao foi possivel concluir a autenticacao agora.'
}

export default function AuthDialog() {
  const {
    authDialog,
    setAuthDialog,
    closeAuth,
    signIn,
    signUp,
  } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackTone, setFeedbackTone] = useState('error')

  const mode = authDialog.mode === 'signup' ? 'signup' : 'login'

  useEffect(() => {
    if (!authDialog.open) return
    setForm(initialForm)
    setFeedback('')
    setFeedbackTone('error')
  }, [authDialog.open, mode])

  if (!authDialog.open) return null

  function changeMode(nextMode) {
    setAuthDialog((current) => ({ ...current, mode: nextMode }))
    setFeedback('')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setFeedback('')

    try {
      if (mode === 'signup') {
        const data = await signUp(form)
        if (!data?.session) {
          setFeedbackTone('success')
          setFeedback('Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre no site.')
          return
        }
      } else {
        await signIn(form)
      }

      closeAuth()
    } catch (error) {
      setFeedbackTone('error')
      setFeedback(getAuthErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bds-auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) closeAuth()
      }}
    >
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[var(--surface,#07162d)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary,#4ea1ff)]">
              Bar dos Amigos
            </span>
            <h2 id="bds-auth-title" className="mt-1 text-2xl font-black text-[var(--text,#fff)]">
              {mode === 'signup' ? 'Criar sua conta' : 'Entrar na sua conta'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={closeAuth}
            disabled={busy}
            className="rounded-full border border-white/10 p-2 text-[var(--text-secondary,#b9c8dd)] transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[var(--text-secondary,#b9c8dd)]">
            <strong className="block text-[var(--text,#fff)]">O site continua livre para visitantes.</strong>
            Voce so precisa de uma conta para participar de recursos como pedidos de musica, favoritos, palpites e outras experiencias pessoais.
          </div>

          {authDialog.reason && (
            <p className="mb-4 rounded-xl border border-[var(--primary,#4ea1ff)]/30 bg-[var(--primary,#4ea1ff)]/10 px-4 py-3 text-sm text-[var(--text,#fff)]">
              {authDialog.reason}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label className="block text-sm font-semibold text-[var(--text,#fff)]">
                Como quer ser chamado?
                <input
                  name="displayName"
                  type="text"
                  minLength={2}
                  maxLength={60}
                  required
                  autoComplete="name"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Seu nome no Bar"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/15 px-4 py-3 text-[var(--text,#fff)] outline-none transition placeholder:text-white/35 focus:border-[var(--primary,#4ea1ff)]"
                />
              </label>
            )}

            <label className="block text-sm font-semibold text-[var(--text,#fff)]">
              E-mail
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="voce@email.com"
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/15 px-4 py-3 text-[var(--text,#fff)] outline-none transition placeholder:text-white/35 focus:border-[var(--primary,#4ea1ff)]"
              />
            </label>

            <label className="block text-sm font-semibold text-[var(--text,#fff)]">
              Senha
              <input
                name="password"
                type="password"
                minLength={6}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Minimo de 6 caracteres"
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/15 px-4 py-3 text-[var(--text,#fff)] outline-none transition placeholder:text-white/35 focus:border-[var(--primary,#4ea1ff)]"
              />
            </label>

            {feedback && (
              <p className={`rounded-xl px-4 py-3 text-sm ${feedbackTone === 'success' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>
                {feedback}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary,#2563eb)] px-4 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {mode === 'signup' ? <UserPlus size={18} /> : <LogIn size={18} />}
              {busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')}
              className="font-semibold text-[var(--primary,#4ea1ff)] hover:underline"
            >
              {mode === 'signup' ? 'Ja tenho conta' : 'Criar uma conta'}
            </button>
            <button
              type="button"
              onClick={closeAuth}
              className="text-[var(--text-secondary,#b9c8dd)] hover:text-[var(--text,#fff)]"
            >
              Continuar como visitante
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
