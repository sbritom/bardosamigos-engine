import { useEffect, useRef, useState } from 'react'
import { AtSign, Camera, LogIn, LogOut, Save, Settings, Sparkles, Star, Trophy, UserPlus, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/AuthContext'
import { PersonalizationShell } from '../components/PersonalizationComponents'

function AccountBenefit({ icon, title, description }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center gap-2 font-bold text-[var(--text)]">
        {icon}
        {title}
      </div>
      <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
    </article>
  )
}

function GuestProfile() {
  const { openAuth } = useAuth()

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Acesso livre</span>
        <h2 className="mt-2 text-3xl font-black text-[var(--text)]">Voce esta navegando como visitante</h2>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--text-secondary)]">
          Nao e preciso criar conta para ouvir a radio, pedir musica, assistir TV, acompanhar futebol, ler noticias, usar o chat ou navegar pelo IMORTAL0800.
        </p>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">
          A conta so e solicitada quando voce quiser usar algo que precise guardar sua identidade ou seus dados, como favoritos, perfil personalizado e palpites.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openAuth('', 'login')}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110"
          >
            <LogIn size={18} />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => openAuth('', 'signup')}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-[var(--text)] transition hover:bg-white/10"
          >
            <UserPlus size={18} />
            Criar conta
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
        <h3 className="text-lg font-black text-[var(--text)]">O que a conta libera?</h3>
        <div className="mt-4 grid gap-3">
          <AccountBenefit icon={<UserRound size={18} />} title="Perfil personalizado" description="Tenha nome de usuario, foto e bio associados a sua conta." />
          <AccountBenefit icon={<Star size={18} />} title="Favoritos" description="Salve canais da TV e times para encontrar depois." />
          <AccountBenefit icon={<Trophy size={18} />} title="Participacoes identificadas" description="Sua identidade podera ser usada em palpites e outras atividades que precisem guardar seu progresso." />
        </div>
      </section>
    </div>
  )
}

function AuthenticatedProfile() {
  const navigate = useNavigate()
  const {
    user,
    displayName,
    profile,
    profileLoading,
    profileError,
    updateProfile,
    uploadAvatar,
    signOut,
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
      setFeedback('Perfil atualizado com sucesso.')
    } catch (error) {
      setTone('error')
      setFeedback(error.message || 'Nao foi possivel atualizar seu perfil.')
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
      setFeedback('Foto de perfil atualizada.')
    } catch (error) {
      setTone('error')
      setFeedback(error.message || 'Nao foi possivel atualizar a foto.')
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
      setFeedback(error.message || 'Nao foi possivel sair da conta.')
      setBusy(false)
    }
  }

  const avatarUrl = profile?.avatarUrl || ''
  const usernameLabel = profile?.username ? `@${profile.username}` : 'Escolha seu @usuario'

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[var(--primary)]/15 text-[var(--primary)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`Foto de ${displayName || 'usuario'}`} className="h-full w-full object-cover" />
              ) : (
                <UserRound size={44} />
              )}
            </div>
            <button
              type="button"
              disabled={avatarBusy || profileLoading}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[var(--primary)] text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
              aria-label="Alterar foto de perfil"
              title="Alterar foto de perfil"
            >
              <Camera size={18} />
            </button>
            <input
              ref={avatarInputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="min-w-0">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Conta conectada</span>
            <h2 className="truncate text-2xl font-black text-[var(--text)]">{displayName || 'Usuário IMORTAL0800'}</h2>
            <p className="flex items-center gap-1 truncate text-sm font-semibold text-[var(--primary)]">
              <AtSign size={14} />
              {usernameLabel.replace(/^@/, '')}
            </p>
            <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{user?.email}</p>
            {avatarBusy && <small className="mt-2 block text-[var(--text-secondary)]">Enviando foto...</small>}
          </div>
        </div>

        {profileError && (
          <p className="mt-5 rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
            {profileError} Os dados basicos da sua conta continuam disponiveis.
          </p>
        )}

        <form className="mt-7" onSubmit={handleSave}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-[var(--text)]">
              Nome exibido
              <input
                name="displayName"
                type="text"
                minLength={2}
                maxLength={60}
                required
                value={form.displayName}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/10 px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            <label className="block text-sm font-bold text-[var(--text)]">
              Nome de usuario
              <div className="relative mt-2">
                <AtSign size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  name="username"
                  type="text"
                  minLength={3}
                  maxLength={24}
                  value={form.username}
                  onChange={handleChange}
                  placeholder="seuusuario"
                  className="w-full rounded-xl border border-white/15 bg-black/10 py-3 pl-10 pr-4 lowercase text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
                />
              </div>
              <small className="mt-1 block font-normal text-[var(--text-secondary)]">Letras, numeros, ponto e underline.</small>
            </label>
          </div>

          <label className="mt-4 block text-sm font-bold text-[var(--text)]">
            Bio
            <textarea
              name="bio"
              rows={3}
              maxLength={280}
              value={form.bio}
              onChange={handleChange}
              placeholder="Conte um pouco sobre voce..."
              className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-black/10 px-4 py-3 text-[var(--text)] outline-none transition placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--primary)]"
            />
            <small className="mt-1 block text-right font-normal text-[var(--text-secondary)]">{form.bio.length}/280</small>
          </label>

          <label className="mt-4 block text-sm font-bold text-[var(--text)]">
            E-mail da conta
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-[var(--text-secondary)] opacity-80"
            />
          </label>

          {feedback && (
            <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${tone === 'success' ? 'bg-emerald-500/15 text-emerald-100' : 'bg-red-500/15 text-red-100'}`}>
              {feedback}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || avatarBusy || profileLoading}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <Save size={18} />
              {busy ? 'Salvando...' : 'Salvar perfil'}
            </button>
            <button
              type="button"
              disabled={busy || avatarBusy}
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-[var(--text)] transition hover:bg-white/10 disabled:opacity-60"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
        <h3 className="text-lg font-black text-[var(--text)]">Seu perfil no portal</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Nome, usuario, bio, foto, favoritos e preferencias ficam associados a sua conta.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Identidade</span>
          <strong className="mt-2 block text-lg text-[var(--text)]">{displayName || 'Usuário IMORTAL0800'}</strong>
          <span className="text-sm text-[var(--primary)]">{profile?.username ? `@${profile.username}` : 'Sem @usuario definido'}</span>
          {profile?.bio && <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{profile.bio}</p>}
        </div>

        <div className="mt-5 grid gap-3">
          <AccountBenefit icon={<UserRound size={18} />} title="Identidade no portal" description="Seu nome, @usuario e avatar ficam disponiveis para recursos que precisem identificar voce." />
          <AccountBenefit icon={<Star size={18} />} title="Favoritos" description="Canais da TV e times salvos acompanham sua conta." />
          <AccountBenefit icon={<Trophy size={18} />} title="Palpites e participacoes" description="Nome, usuario e avatar poderao representar voce nesses recursos." />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/for-you')}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 font-bold text-white transition hover:brightness-110"
          >
            <Sparkles size={18} />
            Meus favoritos
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold text-[var(--text)] transition hover:bg-white/10"
          >
            <Settings size={18} />
            Preferencias
          </button>
        </div>
      </section>
    </div>
  )
}

export default function ProfilePage() {
  const { loading, isAuthenticated } = useAuth()

  return (
    <PersonalizationShell
      eyebrow="Perfil e autenticacao"
      title="Sua area no IMORTAL0800"
      description="Navegue livremente como visitante e use uma conta apenas quando quiser guardar uma experiencia pessoal."
      icon={<UserRound size={40} />}
    >
      {loading ? (
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/10 bg-[var(--surface)] p-8 text-center text-[var(--text-secondary)]">
          Verificando sua sessao...
        </div>
      ) : isAuthenticated ? <AuthenticatedProfile /> : <GuestProfile />}
    </PersonalizationShell>
  )
}
