import { useEffect, useRef, useState } from 'react'
import { AtSign, Camera, KeyRound, LogIn, LogOut, Save, UserPlus, UserRound } from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'
import '../styles/personalization.css'

function GuestProfile() {
  const { openAuth } = useAuth()

  return (
    <main className="imortal-profile-page imortal-profile-page--guest">
      <section className="imortal-profile-access-card">
        <div className="imortal-profile-access-card__icon">
          <UserRound size={32} />
        </div>

        <span className="imortal-profile-eyebrow">CONTA IMORTAL0800</span>
        <h1>Acesse seu perfil</h1>
        <p>Entre na sua conta ou crie um usuário para começar.</p>

        <div className="imortal-profile-access-card__actions">
          <button
            type="button"
            className="is-primary"
            onClick={() => openAuth('', 'login')}
          >
            <LogIn size={17} />
            Entrar
          </button>

          <button
            type="button"
            onClick={() => openAuth('', 'signup')}
          >
            <UserPlus size={16} />
            Criar conta
          </button>
        </div>
      </section>
    </main>
  )
}

function AuthenticatedProfile() {
  const {
    displayName,
    profile,
    profileLoading,
    profileError,
    updateProfile,
    uploadAvatar,
    signOut,
    openAuth,
  } = useAuth()

  const avatarInputRef = useRef(null)
  const [form, setForm] = useState({ displayName: '', username: '', bio: '' })
  const [busy, setBusy] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [tone, setTone] = useState('success')

  useEffect(() => {
    setForm({
      displayName: profile?.displayName || displayName || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    })
  }, [displayName, profile])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setBusy(true)
    setFeedback('')

    try {
      await updateProfile(form)
      setTone('success')
      setFeedback('Perfil atualizado.')
    } catch (error) {
      setTone('error')
      setFeedback(error.message || 'Não foi possível atualizar o perfil.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setAvatarBusy(true)
    setFeedback('')

    try {
      await uploadAvatar(file)
      setTone('success')
      setFeedback('Foto atualizada.')
    } catch (error) {
      setTone('error')
      const message = String(error?.message || '')
      setFeedback(/bucket/i.test(message)
        ? 'A troca de foto está temporariamente indisponível.'
        : message || 'Não foi possível atualizar a foto.')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleSignOut() {
    setBusy(true)
    setFeedback('')

    try {
      await signOut()
    } catch (error) {
      setTone('error')
      setFeedback(error.message || 'Não foi possível sair da conta.')
      setBusy(false)
    }
  }

  const avatarUrl = profile?.avatarUrl || ''
  const currentName = form.displayName || displayName || 'Usuário'
  const currentUsername = form.username || profile?.username || ''

  return (
    <main className="imortal-profile-page">
      <section className="imortal-profile-card">
        <header className="imortal-profile-card__header">
          <div className="imortal-profile-avatar-wrap">
            <div className="imortal-profile-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`Foto de ${currentName}`} />
              ) : (
                <UserRound size={39} />
              )}
            </div>

            <button
              type="button"
              disabled={avatarBusy || profileLoading}
              onClick={() => avatarInputRef.current?.click()}
              className="imortal-profile-avatar-button"
              aria-label="Alterar foto"
              title="Alterar foto"
            >
              <Camera size={16} />
            </button>

            <input
              ref={avatarInputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <span className="imortal-profile-eyebrow">MEU PERFIL</span>
            <h1>{currentName}</h1>
            <p><AtSign size={13} />{currentUsername || 'usuario'}</p>
            {avatarBusy ? <small>Enviando foto...</small> : null}
          </div>
        </header>

        <form className="imortal-profile-form" onSubmit={handleSave}>
          <label>
            <span>Nome exibido</span>
            <input
              name="displayName"
              type="text"
              minLength={2}
              maxLength={60}
              required
              value={form.displayName}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Nome de usuário</span>
            <div className="imortal-profile-input-with-icon">
              <AtSign size={15} />
              <input
                name="username"
                type="text"
                minLength={3}
                maxLength={24}
                value={form.username}
                onChange={handleChange}
                placeholder="seuusuario"
              />
            </div>
          </label>

          <label>
            <span>Bio</span>
            <textarea
              name="bio"
              rows={3}
              maxLength={160}
              value={form.bio}
              onChange={handleChange}
              placeholder="Conte um pouco sobre você..."
            />
          </label>

          {(feedback || profileError) ? (
            <p className={`imortal-profile-feedback ${tone === 'success' && !profileError ? 'is-success' : 'is-error'}`}>
              {feedback || 'Alguns dados do perfil não puderam ser carregados agora.'}
            </p>
          ) : null}

          <div className="imortal-profile-form__actions">
            <button type="submit" className="is-primary" disabled={busy || avatarBusy || profileLoading}>
              <Save size={16} />
              {busy ? 'Salvando...' : 'Salvar perfil'}
            </button>

            <button type="button" onClick={() => openAuth('', 'recover')} disabled={busy || avatarBusy}>
              <KeyRound size={16} />
              Redefinir senha
            </button>
          </div>

          <button
            type="button"
            disabled={busy || avatarBusy}
            onClick={handleSignOut}
            className="imortal-profile-signout"
          >
            <LogOut size={15} />
            Sair da conta
          </button>
        </form>
      </section>
    </main>
  )
}

export default function ProfilePage() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <main className="imortal-profile-page imortal-profile-page--guest">
        <div className="imortal-profile-loading">Carregando perfil...</div>
      </main>
    )
  }

  return isAuthenticated ? <AuthenticatedProfile /> : <GuestProfile />
}
