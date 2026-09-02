import { KeyRound, LogIn, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from './AuthContext'

const initialForm = {
  username: '',
  password: '',
  confirmPassword: '',
  recoveryCode: '',
}

function getAuthErrorMessage(error) {
  return String(error?.message || 'Não foi possível concluir a autenticação.')
}

export default function AuthDialog() {
  const {
    authDialog,
    setAuthDialog,
    closeAuth,
    signIn,
    signUp,
    recoverPassword,
  } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  const mode = ['signup', 'recover'].includes(authDialog.mode) ? authDialog.mode : 'login'

  useEffect(() => {
    if (!authDialog.open) return
    setForm(initialForm)
    setFeedback('')
    setRecoveryCode('')
  }, [authDialog.open, mode])

  if (!authDialog.open) return null

  function changeMode(nextMode) {
    setAuthDialog((current) => ({ ...current, mode: nextMode }))
    setFeedback('')
    setRecoveryCode('')
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
        if (form.password !== form.confirmPassword) {
          throw new Error('As senhas não conferem.')
        }

        const data = await signUp({
          username: form.username,
          password: form.password,
        })

        if (data?.recoveryCode) {
          setRecoveryCode(data.recoveryCode)
          setFeedback('Conta criada. Guarde seu código de recuperação.')
          return
        }

        closeAuth()
        return
      }

      if (mode === 'recover') {
        if (form.password !== form.confirmPassword) {
          throw new Error('As senhas não conferem.')
        }

        const data = await recoverPassword({
          username: form.username,
          recoveryCode: form.recoveryCode,
          password: form.password,
        })

        if (data?.recoveryCode) {
          setRecoveryCode(data.recoveryCode)
          setFeedback('Senha alterada. Guarde seu novo código de recuperação.')
          return
        }

        setFeedback('Senha alterada. Você já pode entrar.')
        return
      }

      const data = await signIn({
        username: form.username,
        password: form.password,
      })

      if (data?.recoveryCode) {
        setRecoveryCode(data.recoveryCode)
        setFeedback('Guarde seu código de recuperação.')
        return
      }

      closeAuth()
    } catch (error) {
      setFeedback(getAuthErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'signup'
    ? 'Criar conta'
    : mode === 'recover'
      ? 'Recuperar senha'
      : 'Login'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="imortal-auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) closeAuth()
      }}
    >
      <section className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#07101c] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="imortal-auth-title" className="text-xl font-black text-white">{title}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={closeAuth}
            disabled={busy}
            className="rounded-lg p-2 text-white/55 transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
          {!recoveryCode ? (
            <>
              <label className="block text-sm font-semibold text-white/80">
                Usuário
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="GIAN"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#15C9FF]"
                />
              </label>

              {mode === 'recover' && (
                <label className="block text-sm font-semibold text-white/80">
                  Código de recuperação
                  <input
                    name="recoveryCode"
                    type="text"
                    required
                    value={form.recoveryCode}
                    onChange={handleChange}
                    placeholder="XXXX-XXXX-XXXX"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#15C9FF]"
                  />
                </label>
              )}

              <label className="block text-sm font-semibold text-white/80">
                {mode === 'recover' ? 'Nova senha' : 'Senha'}
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#15C9FF]"
                />
              </label>

              {(mode === 'signup' || mode === 'recover') && (
                <label className="block text-sm font-semibold text-white/80">
                  Confirmar senha
                  <input
                    name="confirmPassword"
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#15C9FF]"
                  />
                </label>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-[#15C9FF]/20 bg-[#0B78FF]/10 p-4 text-center">
              <span className="text-xs font-bold uppercase tracking-[.08em] text-white/45">Código de recuperação</span>
              <strong className="mt-2 block text-xl tracking-[.08em] text-[#15C9FF]">{recoveryCode}</strong>
              <p className="mt-2 text-xs leading-5 text-white/50">Guarde este código. Ele será necessário caso você esqueça a senha.</p>
            </div>
          )}

          {feedback && (
            <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{feedback}</p>
          )}

          {!recoveryCode ? (
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B78FF] px-4 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {mode === 'signup' ? <UserPlus size={17} /> : mode === 'recover' ? <KeyRound size={17} /> : <LogIn size={17} />}
              {busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : mode === 'recover' ? 'Alterar senha' : 'Entrar'}
            </button>
          ) : (
            <button
              type="button"
              onClick={closeAuth}
              className="w-full rounded-xl bg-[#0B78FF] px-4 py-3 font-bold text-white transition hover:brightness-110"
            >
              Concluir
            </button>
          )}

          {!recoveryCode && (
            <div className="flex items-center justify-between gap-3 text-sm">
              {mode === 'login' ? (
                <>
                  <button type="button" onClick={() => changeMode('signup')} className="font-semibold text-[#15C9FF] hover:underline">
                    Criar conta
                  </button>
                  <button type="button" onClick={() => changeMode('recover')} className="text-white/55 hover:text-white">
                    Recuperar senha
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => changeMode('login')} className="font-semibold text-[#15C9FF] hover:underline">
                  Voltar ao login
                </button>
              )}
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
