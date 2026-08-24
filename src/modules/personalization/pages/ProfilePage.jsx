import { useEffect, useState } from 'react'
import { LogIn, LogOut, Music2, Save, Star, Trophy, UserPlus, UserRound } from 'lucide-react'

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
          Nao e preciso criar conta para ouvir a radio, assistir TV, acompanhar futebol, ler noticias, usar o chat ou navegar pelo Bar dos Amigos.
        </p>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">
          A conta so e solicitada quando voce quiser participar de algo que precise identificar voce, como pedir uma musica, salvar favoritos ou participar de palpites.
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
          <AccountBenefit icon={<Music2 size={18} />} title="Pedidos de musica" description="Envie pedidos para o painel do locutor usando sua conta." />
          <AccountBenefit icon={<Star size={18} />} title="Favoritos" description="Base para salvar canais, times e outros conteudos pessoais." />
          <AccountBenefit icon={<Trophy size={18} />} title="Participacoes" description="Sua identidade podera ser usada em palpites e outras atividades do portal." />
        </div>
      </section>
    </div>
  )
}

function AuthenticatedProfile() {
  const { user, displayName, updateProfile, signOut } = useAuth()
  const [name, setName] = useState(displayName || '')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [tone, setTone] = useState('success')

  useEffect(() => {
    setName(displayName || '')
  }, [displayName])

  async function handleSave(event) {
    event.preventDefault()
    setBusy(true)
    setFeedback('')

    try {
      await updateProfile({ displayName: name })
      setTone('success')
      setFeedback('Perfil atualizado com sucesso.')
    } catch (error) {
      setTone('error')
      setFeedback(error.message || 'Nao foi possivel atualizar seu perfil.')
    } finally {
      setBusy(false)
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

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <UserRound size={32} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Conta conectada</span>
            <h2 className="truncate text-2xl font-black text-[var(--text)]">{displayName || 'Amigo do Bar'}</h2>
            <p className="truncate text-sm text-[var(--text-secondary)]">{user?.email}</p>
          </div>
        </div>

        <form className="mt-7" onSubmit={handleSave}>
          <label className="block text-sm font-bold text-[var(--text)]">
            Nome exibido
            <input
              type="text"
              minLength={2}
              maxLength={60}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/10 px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="mt-4 block text-sm font-bold text-[var(--text)]">
            E-mail
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-[var(--text-secondary)] opacity-80"
            />
          </label>

          {feedback && (
            <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${tone === 'success' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>
              {feedback}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <Save size={18} />
              {busy ? 'Salvando...' : 'Salvar perfil'}
            </button>
            <button
              type="button"
              disabled={busy}
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
        <h3 className="text-lg font-black text-[var(--text)]">Sua conta no portal</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          A conta identifica suas participacoes sem transformar o restante do site em uma area fechada.
        </p>
        <div className="mt-5 grid gap-3">
          <AccountBenefit icon={<Music2 size={18} />} title="Pedidos de musica" description="Liberado para sua conta." />
          <AccountBenefit icon={<Star size={18} />} title="Favoritos" description="Sera conectado aos recursos pessoais na proxima etapa." />
          <AccountBenefit icon={<Trophy size={18} />} title="Palpites e participacoes" description="A autenticacao ja fica pronta para identificar voce nesses fluxos." />
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
      title="Sua area no Bar dos Amigos"
      description="Navegue livremente como visitante e use uma conta apenas quando quiser participar."
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
