import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogIn,
  User,
  UserPlus,
  X,
} from 'lucide-react'
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

function AuthField({
  label,
  icon: Icon,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  maxLength,
  required = true,
  trailing,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-[#8EA6C9]">
        {label}
      </span>

      <div className="group flex min-h-[52px] items-center gap-3 rounded-2xl border border-[#2A8FFF]/15 bg-[#07111E]/85 px-4 transition duration-200 focus-within:border-[#15C9FF]/65 focus-within:bg-[#081624] focus-within:shadow-[0_0_0_4px_rgba(21,201,255,0.07)]">
        <Icon
          size={18}
          className="shrink-0 text-[#5C85C7] transition group-focus-within:text-[#15C9FF]"
          aria-hidden="true"
        />

        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          className="h-[50px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] font-semibold text-white outline-none placeholder:font-medium placeholder:text-[#536A8C]"
        />

        {trailing}
      </div>
    </label>
  )
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const mode = ['signup', 'recover'].includes(authDialog.mode) ? authDialog.mode : 'login'

  useEffect(() => {
    if (!authDialog.open) return
    setForm(initialForm)
    setFeedback('')
    setRecoveryCode('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [authDialog.open, mode])

  if (!authDialog.open) return null

  function changeMode(nextMode) {
    setAuthDialog((current) => ({ ...current, mode: nextMode }))
    setFeedback('')
    setRecoveryCode('')
    setShowPassword(false)
    setShowConfirmPassword(false)
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

  const isLogin = mode === 'login'
  const isSignup = mode === 'signup'
  const title = isSignup ? 'Criar conta' : mode === 'recover' ? 'Recuperar senha' : 'Entrar'
  const subtitle = isSignup
    ? 'Crie seu usuário para participar dos recursos pessoais.'
    : mode === 'recover'
      ? 'Use seu código de recuperação para definir uma nova senha.'
      : 'Acesse sua conta IMORTAL0800.'

  const passwordToggle = (
    <button
      type="button"
      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      onClick={() => setShowPassword((current) => !current)}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#6685AF] transition hover:bg-white/[0.04] hover:text-[#15C9FF]"
    >
      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  const confirmPasswordToggle = (
    <button
      type="button"
      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
      title={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
      onClick={() => setShowConfirmPassword((current) => !current)}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#6685AF] transition hover:bg-white/[0.04] hover:text-[#15C9FF]"
    >
      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#01050B]/80 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="imortal-auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) closeAuth()
      }}
    >
      <section className="relative w-full max-w-[410px] overflow-hidden rounded-[28px] border border-[#2A8FFF]/20 bg-[#050B14]/95 shadow-[0_28px_90px_rgba(0,0,0,0.58)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0B78FF]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-[#15C9FF]/10 blur-3xl" />

        <div className="relative border-b border-[#2A8FFF]/10 px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full border border-[#2A8FFF]/20 bg-[#0B78FF]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#72B5FF]">
                IMORTAL0800
              </span>

              <h2
                id="imortal-auth-title"
                className="mt-4 text-[28px] font-black leading-none tracking-[-0.035em] text-white"
              >
                {title}
              </h2>

              <p className="mt-2 max-w-[300px] text-[13px] leading-5 text-[#7F93B1]">
                {subtitle}
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              onClick={closeAuth}
              disabled={busy}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.025] text-[#7287A6] transition hover:border-[#2A8FFF]/20 hover:bg-[#0B78FF]/10 hover:text-white disabled:cursor-wait disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form className="relative space-y-4 px-6 py-6" onSubmit={handleSubmit}>
          {!recoveryCode ? (
            <>
              <AuthField
                label="Usuário"
                icon={User}
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Usuário"
                autoComplete="username"
                minLength={3}
                maxLength={20}
              />

              {mode === 'recover' && (
                <AuthField
                  label="Código de recuperação"
                  icon={KeyRound}
                  name="recoveryCode"
                  value={form.recoveryCode}
                  onChange={handleChange}
                  placeholder="XXXX-XXXX-XXXX"
                  autoComplete="off"
                />
              )}

              <AuthField
                label={mode === 'recover' ? 'Nova senha' : 'Senha'}
                icon={LockKeyhole}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Senha"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
                trailing={passwordToggle}
              />

              {(isSignup || mode === 'recover') && (
                <AuthField
                  label="Confirmar senha"
                  icon={LockKeyhole}
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmar senha"
                  autoComplete="new-password"
                  minLength={6}
                  trailing={confirmPasswordToggle}
                />
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-[#15C9FF]/20 bg-[#0B78FF]/10 p-5 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7EA8D8]">
                Código de recuperação
              </span>
              <strong className="mt-3 block text-[20px] font-black tracking-[0.10em] text-[#15C9FF]">
                {recoveryCode}
              </strong>
              <p className="mt-3 text-[12px] leading-5 text-[#8BA0BD]">
                Guarde este código. Ele será necessário caso você esqueça a senha.
              </p>
            </div>
          )}

          {feedback && (
            <p
              className="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3 text-[12px] font-medium leading-5 text-[#B6C5DB]"
              role="status"
            >
              {feedback}
            </p>
          )}

          {!recoveryCode ? (
            <button
              type="submit"
              disabled={busy}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#3DA8FF]/35 bg-[linear-gradient(135deg,#0B78FF,#0759CB)] px-4 text-[14px] font-black text-white shadow-[0_14px_30px_rgba(11,120,255,0.22)] transition duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_18px_36px_rgba(11,120,255,0.28)] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
            >
              {isSignup ? <UserPlus size={17} /> : mode === 'recover' ? <KeyRound size={17} /> : <LogIn size={17} />}
              {busy ? 'Aguarde...' : isSignup ? 'Criar conta' : mode === 'recover' ? 'Alterar senha' : 'Entrar'}
            </button>
          ) : (
            <button
              type="button"
              onClick={closeAuth}
              className="min-h-[52px] w-full rounded-2xl border border-[#3DA8FF]/35 bg-[linear-gradient(135deg,#0B78FF,#0759CB)] px-4 text-[14px] font-black text-white transition hover:brightness-110"
            >
              Concluir
            </button>
          )}

          {!recoveryCode && isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => changeMode('signup')}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-[#2A8FFF]/12 bg-[#08111D] px-3 text-[12px] font-bold text-[#B6C7DE] transition hover:border-[#2A8FFF]/28 hover:bg-[#0B1726] hover:text-white"
                >
                  <UserPlus size={15} />
                  Criar conta
                </button>

                <button
                  type="button"
                  onClick={() => changeMode('recover')}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-[#2A8FFF]/12 bg-[#08111D] px-3 text-[12px] font-bold text-[#B6C7DE] transition hover:border-[#2A8FFF]/28 hover:bg-[#0B1726] hover:text-white"
                >
                  <KeyRound size={15} />
                  Recuperar senha
                </button>
              </div>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-[#2A8FFF]/10" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#536A8C]">ou</span>
                <span className="h-px flex-1 bg-[#2A8FFF]/10" />
              </div>

              <button
                type="button"
                onClick={closeAuth}
                className="min-h-[44px] w-full rounded-2xl border border-dashed border-[#2A8FFF]/18 bg-transparent px-4 text-[12px] font-bold text-[#7692B8] transition hover:border-[#15C9FF]/30 hover:bg-[#0B78FF]/[0.05] hover:text-[#A8CFFF]"
              >
                Continuar como visitante
              </button>
            </>
          )}

          {!recoveryCode && !isLogin && (
            <button
              type="button"
              onClick={() => changeMode('login')}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[#2A8FFF]/12 bg-[#08111D] px-4 text-[12px] font-bold text-[#A9BDD7] transition hover:border-[#2A8FFF]/25 hover:text-white"
            >
              <ArrowLeft size={15} />
              Voltar ao login
            </button>
          )}
        </form>

        <div className="relative flex items-center justify-center border-t border-[#2A8FFF]/10 bg-[#03070D]/45 px-6 py-3">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#415574]">
            Sua conta • Seu acesso • IMORTAL0800
          </span>
        </div>
      </section>
    </div>
  )
}
