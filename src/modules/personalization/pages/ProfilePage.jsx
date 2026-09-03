import { useEffect, useRef, useState } from 'react'
import { AtSign, Camera, KeyRound, LogIn, LogOut, Save, UserPlus, UserRound } from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'
import '../styles/personalization.css'

function GuestProfile() {
  const { openAuth } = useAuth()

  return (
    <main className="bds-personalization-page">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-[var(--primary)]/10 text-[var(--primary)]">
          <UserRound size={38} />
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-2xl font-black text-[var(--text)]">Perfil</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Entre na sua conta para editar nome, usuário, bio e foto.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => openAuth('', 'login')}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 font-black text-white transition hover:brightness-110"
          >
            <LogIn size={17} />
            Entrar
          </button>

          <button
            type="button"
            onClick={() => openAuth('', 'signup')}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 font-bold text-[var(--text)] transition hover:bg-white/[0.07]"
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
    <main className="bds-personalization-page">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[var(--surface)] p-5 shadow-xl sm:p-7">
        <header className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[var(--primary)]/10 text-[var(--primary)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${currentName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={43} />
              )}
            </div>

            <button
              type="button"
              disabled={avatarBusy || profileLoading}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[var(--primary)] text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
              aria-label="Alterar foto"
              title="Alterar foto"
            >
              <Camera size={17} />
            </button>

            <input
              ref={avatarInputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
            />
          </div>

          <h1 className="mt-5 max-w-full truncate text-2xl font-black text-[var(--text)]">
            {currentName}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[var(--primary)]">
            <AtSign size={14} />
            {currentUsername || 'usuario'}
          </p>
          {avatarBusy ? (
            <small className="mt-2 text-[var(--text-secondary)]">Enviando foto...</small>
          ) : null}
        </header>

        <form className="mt-7 grid gap-4" onSubmit={handleSave}>
          <label className="grid gap-2 text-sm font-bold text-[var(--text)]">
            Nome exibido
            <input
              name="displayName"
              type="text"
              minLength={2}
              maxLength={60}
              required
              value={form.displayName}
              onChange={handleChange}
              className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--text)]">
            Nome de usuário
            <div className="relative">
              <AtSign
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                name="username"
                type="text"
                minLength={3}
                maxLength={24}
                value={form.username}
                onChange={handleChange}
                placeholder="seuusuario"
                className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/10 py-3 pl-10 pr-4 lowercase text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--text)]">
            Bio
            <textarea
              name="bio"
              rows={3}
              maxLength={160}
              value={form.bio}
              onChange={handleChange}
              placeholder="Conte um pouco sobre você..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-[var(--text)] outline-none transition placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--primary)]"
            />
          </label>

          {(feedback || profileError) ? (
            <p className={`rounded-2xl px-4 py-3 text-sm ${
              tone === 'success' && !profileError
                ? 'bg-emerald-500/10 text-emerald-100'
                : 'bg-red-500/10 text-red-100'
            }`}>
              {feedback || 'Alguns dados do perfil não puderam ser carregados agora.'}
            </p>
          ) : null}

          <div className="mt-1 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={busy || avatarBusy || profileLoading}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 font-black text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <Save size={17} />
              {busy ? 'Salvando...' : 'Salvar perfil'}
            </button>

            <button
              type="button"
              onClick={() => openAuth('', 'recover')}
              disabled={busy || avatarBusy}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 font-bold text-[var(--text)] transition hover:bg-white/[0.07] disabled:opacity-60"
            >
              <KeyRound size={17} />
              Redefinir senha
            </button>
          </div>

          <button
            type="button"
            disabled={busy || avatarBusy}
            onClick={handleSignOut}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-5 text-sm font-bold text-[var(--text-secondary)] transition hover:bg-white/[0.04] hover:text-[var(--text)] disabled:opacity-60"
          >
            <LogOut size={16} />
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
      <main className="bds-personalization-page">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[var(--surface)] p-8 text-center text-[var(--text-secondary)]">
          Carregando perfil...
        </div>
      </main>
    )
  }

  return isAuthenticated ? <AuthenticatedProfile /> : <GuestProfile />
}
