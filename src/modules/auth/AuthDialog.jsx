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
import './authDialog.css'

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
    <label className="imortal-auth-field">
      <span>{label}</span>

      <div>
        <Icon size={17} aria-hidden="true" />
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
  const title = isSignup ? 'Criar conta' : mode === 'recover' ? 'Redefinir senha' : 'Entrar'
  const subtitle = isSignup
    ? 'Escolha um usuário e uma senha.'
    : mode === 'recover'
      ? 'Use seu código de recuperação para criar uma nova senha.'
      : 'Acesse sua conta IMORTAL0800.'

  const passwordToggle = (
    <button
      type="button"
      className="imortal-auth-password-toggle"
      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      onClick={() => setShowPassword((current) => !current)}
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )

  const confirmPasswordToggle = (
    <button
      type="button"
      className="imortal-auth-password-toggle"
      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
      title={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
      onClick={() => setShowConfirmPassword((current) => !current)}
    >
      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )

  return (
    <div
      className="imortal-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="imortal-auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) closeAuth()
      }}
    >
      <section className="imortal-auth-dialog">
        <header className="imortal-auth-dialog__header">
          <div>
            <span>CONTA IMORTAL0800</span>
            <h2 id="imortal-auth-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button
            type="button"
            className="imortal-auth-close"
            aria-label="Fechar"
            onClick={closeAuth}
            disabled={busy}
          >
            <X size={17} />
          </button>
        </header>

        <form className="imortal-auth-form" onSubmit={handleSubmit}>
          {!recoveryCode ? (
            <>
              <AuthField
                label="Usuário"
                icon={User}
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Seu usuário"
                autoComplete="username"
                minLength={3}
                maxLength={20}
              />

              {mode === 'recover' ? (
                <AuthField
                  label="Código de recuperação"
                  icon={KeyRound}
                  name="recoveryCode"
                  value={form.recoveryCode}
                  onChange={handleChange}
                  placeholder="XXXX-XXXX-XXXX"
                  autoComplete="off"
                />
              ) : null}

              <AuthField
                label={mode === 'recover' ? 'Nova senha' : 'Senha'}
                icon={LockKeyhole}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder={mode === 'recover' ? 'Nova senha' : 'Sua senha'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
                trailing={passwordToggle}
              />

              {isLogin ? (
                <button
                  type="button"
                  className="imortal-auth-recover-link"
                  onClick={() => changeMode('recover')}
                >
                  <KeyRound size={13} />
                  Recuperar senha
                </button>
              ) : null}

              {(isSignup || mode === 'recover') ? (
                <AuthField
                  label="Confirmar senha"
                  icon={LockKeyhole}
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  minLength={6}
                  trailing={confirmPasswordToggle}
                />
              ) : null}
            </>
          ) : (
            <div className="imortal-auth-recovery-code">
              <span>Código de recuperação</span>
              <strong>{recoveryCode}</strong>
              <p>Guarde este código em um local seguro. Ele será necessário se você esquecer sua senha.</p>
            </div>
          )}

          {feedback ? (
            <p className="imortal-auth-feedback" role="status">{feedback}</p>
          ) : null}

          {!recoveryCode ? (
            <button type="submit" disabled={busy} className="imortal-auth-primary">
              {isSignup ? <UserPlus size={16} /> : mode === 'recover' ? <KeyRound size={16} /> : <LogIn size={16} />}
              {busy ? 'Aguarde...' : isSignup ? 'Criar conta' : mode === 'recover' ? 'Redefinir senha' : 'Entrar'}
            </button>
          ) : (
            <button type="button" className="imortal-auth-primary" onClick={closeAuth}>
              Concluir
            </button>
          )}

          {!recoveryCode && isLogin ? (
            <div className="imortal-auth-secondary-actions">
              <button type="button" onClick={() => changeMode('signup')}>
                <UserPlus size={15} />
                Criar conta
              </button>
              <button type="button" className="is-visitor" onClick={closeAuth}>
                Continuar como visitante
              </button>
            </div>
          ) : null}

          {!recoveryCode && !isLogin ? (
            <button
              type="button"
              className="imortal-auth-back"
              onClick={() => changeMode('login')}
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </button>
          ) : null}
        </form>
      </section>
    </div>
  )
}
