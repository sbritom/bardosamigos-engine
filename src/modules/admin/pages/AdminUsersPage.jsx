import { useEffect, useMemo, useState } from 'react'
import { Headphones, RefreshCw, Search, ShieldCheck, UserRound, Users } from 'lucide-react'

import { changeAdminUserRole, listAdminUsers } from '../services/adminUsersService.js'

const ROLE_LABELS = {
  admin: 'Administrador',
  locutor: 'Locutor',
  user: 'Usuário',
}

function formatDate(value) {
  if (!value) return 'Nunca'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      setUsers(await listAdminUsers())
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) => {
      return [
        user.displayName,
        user.username,
        ROLE_LABELS[user.role],
      ].some((value) => String(value || '').toLowerCase().includes(term))
    })
  }, [query, users])

  async function handleRoleChange(user) {
    const nextRole = user.role === 'locutor' ? 'user' : 'locutor'
    const actionLabel = nextRole === 'locutor' ? 'tornar este usuário locutor' : 'remover o cargo de locutor'

    if (!window.confirm(`Deseja realmente ${actionLabel}?`)) return

    setBusyId(user.id)
    setFeedback('')
    setError('')

    try {
      await changeAdminUserRole(user.id, nextRole)
      setUsers((current) => current.map((item) => (
        item.id === user.id ? { ...item, role: nextRole } : item
      )))
      setFeedback(
        nextRole === 'locutor'
          ? `@${user.username || user.displayName} agora é locutor. A pessoa deve sair e entrar novamente para a permissão aparecer.`
          : `Cargo de locutor removido de @${user.username || user.displayName}. A alteração vale na próxima sessão.`,
      )
    } catch (updateError) {
      setError(updateError.message || 'Não foi possível alterar o cargo.')
    } finally {
      setBusyId('')
    }
  }

  const locutorCount = users.filter((user) => user.role === 'locutor').length
  const userCount = users.filter((user) => user.role === 'user').length

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:py-10">
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 shadow-xl md:p-7">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">Administração</span>
            <h1 className="mt-1 text-2xl font-black text-[var(--text)] md:text-3xl">Usuários e cargos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Gerencie quem pode acessar o Painel do Locutor. Contas comuns não podem conceder cargos a si mesmas.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-[var(--text)] transition hover:bg-white/[0.07] disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Usuários comuns</span>
            <strong className="mt-1 block text-2xl text-[var(--text)]">{userCount}</strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Locutores</span>
            <strong className="mt-1 block text-2xl text-[var(--text)]">{locutorCount}</strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Total de contas</span>
            <strong className="mt-1 block text-2xl text-[var(--text)]">{users.length}</strong>
          </div>
        </div>

        <label className="relative mt-5 block">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, @usuário ou cargo"
            className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/10 py-3 pl-11 pr-4 text-[var(--text)] outline-none transition placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--primary)]"
          />
        </label>

        {feedback ? (
          <p className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-[var(--text-secondary)]">
              Carregando usuários...
            </div>
          ) : filteredUsers.length ? (
            filteredUsers.map((user) => (
              <article
                key={user.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[var(--primary)]/10 text-[var(--primary)]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={24} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-[var(--text)]">{user.displayName}</strong>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                        user.role === 'admin'
                          ? 'bg-amber-500/10 text-amber-200'
                          : user.role === 'locutor'
                            ? 'bg-sky-500/10 text-sky-200'
                            : 'bg-white/[0.05] text-[var(--text-secondary)]'
                      }`}>
                        {ROLE_LABELS[user.role] || 'Usuário'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-[var(--primary)]">
                      @{user.username || 'sem-usuario'}
                    </p>
                    <small className="mt-1 block text-xs text-[var(--text-secondary)]">
                      Último acesso: {formatDate(user.lastSignInAt)}
                    </small>
                  </div>
                </div>

                {user.manageable ? (
                  <button
                    type="button"
                    disabled={busyId === user.id}
                    onClick={() => handleRoleChange(user)}
                    className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:opacity-60 ${
                      user.role === 'locutor'
                        ? 'border border-white/10 bg-white/[0.04] text-[var(--text)] hover:bg-white/[0.07]'
                        : 'bg-[var(--primary)] text-white hover:brightness-110'
                    }`}
                  >
                    {user.role === 'locutor' ? <Users size={16} /> : <Headphones size={16} />}
                    {busyId === user.id
                      ? 'Salvando...'
                      : user.role === 'locutor'
                        ? 'Remover locutor'
                        : 'Tornar locutor'}
                  </button>
                ) : (
                  <span className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-[var(--text-secondary)]">
                    <ShieldCheck size={16} />
                    Protegido
                  </span>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-[var(--text-secondary)]">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
