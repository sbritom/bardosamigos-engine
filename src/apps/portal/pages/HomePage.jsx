import { lazy, Suspense } from 'react'
import { Coins, Play, Radio, Trophy, Tv } from 'lucide-react'
import { Badge, Button, Loading, Progress, StatCard } from '../../../design-system'
import { useRadio } from '../../../core/providers/RadioProvider'
import { DashboardCard } from '../home/components/DashboardCard'
import { StatusPill } from '../home/components/StatusPill'
import { TeamShield } from '../home/components/TeamShield'
import { useCountdown } from '../home/hooks/useCountdown'
import { communityEvents, latestNews, nextMatch, ranking, tvEvent } from '../home/data/dashboardData'

const OfficialChat = lazy(() => import('../../../modules/chat/components/OfficialChat').then((module) => ({ default: module.OfficialChat })))

function formatCountdown(remaining) {
  return `${String(remaining.hours).padStart(2, '0')}h ${String(remaining.minutes).padStart(2, '0')}m ${String(remaining.seconds).padStart(2, '0')}s`
}

function HeroSection() {
  const remaining = useCountdown(nextMatch.startsAt)

  return (
    <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[linear-gradient(120deg,#050505,#17110a,#050505)] p-5 shadow-xl">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr] xl:items-center">
        <div>
          <Badge tone="gold">Bar dos Amigos Engine</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Bem-vindo ao painel principal da plataforma.
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--secondary)]">
            TV, chat oficial, competicoes, radio, noticias, ranking e comunidade reunidos em uma Home inteligente.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button>Fazer Palpite</Button>
            <Button variant="secondary">Assistir ao Vivo</Button>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-black p-4">
          <div className="flex items-center justify-between gap-3">
            <StatusPill>{nextMatch.championship}</StatusPill>
            <StatusPill tone="live">{formatCountdown(remaining)}</StatusPill>
          </div>

          <div className="mt-5 grid grid-cols-3 items-center text-center">
            <div>
              <TeamShield label={nextMatch.homeShield} />
              <div className="mt-3 font-black">{nextMatch.homeTeam}</div>
            </div>
            <div className="text-3xl font-black text-[var(--gold)]">VS</div>
            <div>
              <TeamShield label={nextMatch.awayShield} />
              <div className="mt-3 font-black">{nextMatch.awayTeam}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CompetitionCard() {
  return (
    <DashboardCard title="Bar Competition" eyebrow="Proximo jogo" action={<Button>Fazer Palpite</Button>}>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="text-center">
          <TeamShield label={nextMatch.homeShield} />
          <div className="mt-2 font-black">{nextMatch.homeTeam}</div>
        </div>
        <div className="text-center text-3xl font-black text-[var(--gold)]">VS</div>
        <div className="text-center">
          <TeamShield label={nextMatch.awayShield} />
          <div className="mt-2 font-black">{nextMatch.awayTeam}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <StatCard label="Campeonato" value={nextMatch.championship} />
        <StatCard label="Horario" value={new Date(nextMatch.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} />
        <StatCard label="Palpites" value={nextMatch.predictions.toLocaleString('pt-BR')} />
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-black p-3">
        <div className="text-xs font-black uppercase text-[var(--secondary)]">Seu ultimo palpite</div>
        <div className="mt-1 font-black text-[var(--gold)]">{nextMatch.lastPrediction}</div>
      </div>
    </DashboardCard>
  )
}

function TvCard() {
  return (
    <DashboardCard title="TV Ao Vivo" eyebrow="Player atual" action={<StatusPill tone="live">{tvEvent.status}</StatusPill>}>
      <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-black">
        <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#1a1a1a,#050505)]">
          <div className="text-center">
            <Play size={54} className="mx-auto text-[var(--gold)]" />
            <div className="mt-3 text-3xl font-black">
              FUTEBOL <span className="text-[var(--gold)]">AO VIVO</span>
            </div>
            <div className="mt-2 text-sm text-[var(--secondary)]">Assista agora</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Proximo evento" value={tvEvent.title} />
        <StatCard label="Categoria" value={tvEvent.category} />
        <StatCard label="Status" value={tvEvent.status} />
      </div>
    </DashboardCard>
  )
}

function RadioCard() {
  const { currentStation, playing, toggle } = useRadio()

  return (
    <DashboardCard title="Radio" eyebrow="Player melhorado" action={<StatusPill tone={playing ? 'live' : 'muted'}>{playing ? 'Online' : 'Pausada'}</StatusPill>}>
      <div className="flex items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-black p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius)] bg-[var(--gold)] text-black">
          <Radio size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black uppercase text-[var(--gold)]">Musica atual</div>
          <div className="truncate text-lg font-black">{currentStation.name}</div>
          <div className="text-sm text-[var(--secondary)]">{currentStation.program}</div>
          <Progress value={playing ? 68 : 24} />
        </div>
        <Button onClick={toggle}>{playing ? 'Pausar' : 'Tocar'}</Button>
      </div>
    </DashboardCard>
  )
}

function NewsCard() {
  return (
    <DashboardCard title="Ultimas noticias" eyebrow="Portal">
      <div className="space-y-3">
        {latestNews.map((item) => (
          <article key={item.id} className="grid grid-cols-[88px_1fr] gap-3 rounded-xl border border-[var(--border)] bg-black p-3">
            <img src={item.thumbnail} alt="" loading="lazy" className="h-20 w-full rounded-lg object-cover" />
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusPill>{item.category}</StatusPill>
                <span className="text-xs text-[var(--secondary)]">{item.date}</span>
              </div>
              <h3 className="mt-2 font-black">{item.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </DashboardCard>
  )
}

function RankingCard() {
  return (
    <DashboardCard title="Ranking" eyebrow="Top 10">
      <div className="space-y-2">
        {ranking.map(([name, score], index) => (
          <div key={name} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)] text-sm font-black text-black">{index + 1}</span>
              <span className="font-bold">{name}</span>
            </div>
            <span className="text-sm font-black text-[var(--gold)]">{score.toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

function BarCoinsCard() {
  const isLoggedIn = false

  return (
    <DashboardCard title="BarCoins" eyebrow="Carteira" action={<Coins className="text-[var(--gold)]" />}>
      {isLoggedIn ? (
        <StatCard label="Saldo" value="0" hint="Disponivel para recompensas" />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-black p-4">
          <p className="text-[var(--secondary)]">Entre para ver saldo, missoes e recompensas.</p>
          <Button className="mt-4">Entrar</Button>
        </div>
      )}
    </DashboardCard>
  )
}

function EventsCard() {
  return (
    <DashboardCard title="Eventos" eyebrow="Comunidade">
      <div className="space-y-3">
        {communityEvents.map((event) => (
          <div key={event.id} className="rounded-xl border border-[var(--border)] bg-black p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black">{event.title}</h3>
              <StatusPill>{event.category}</StatusPill>
            </div>
            <div className="mt-1 text-sm text-[var(--secondary)]">{event.date}</div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

function SystemFooter() {
  return (
    <footer className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm md:grid-cols-4">
      <div><strong>Versao</strong><br /><span className="text-[var(--secondary)]">0.0.0-dashboard</span></div>
      <div><strong>Servidor</strong><br /><span className="text-[var(--success)]">Online</span></div>
      <div><strong>Supabase</strong><br /><span className="text-[var(--success)]">Preparado</span></div>
      <div><strong>BarAI</strong><br /><span className="text-[var(--gold)]">Core ativo</span></div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <main className="pb-6">
      <div className="mx-auto max-w-[1600px] space-y-5 px-4">
        <HeroSection />

        <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <CompetitionCard />
          <TvCard />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <Suspense fallback={<Loading label="Carregando chat oficial" />}>
              <OfficialChat />
            </Suspense>
            <RadioCard />
            <NewsCard />
          </div>

          <aside className="space-y-5">
            <RankingCard />
            <BarCoinsCard />
            <EventsCard />
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Modulos integrados" value="10" hint="Dashboard principal" />
          <StatCard label="Comunidade" value="Online" hint="Chat oficial xat" />
          <StatCard label="Competicoes" value="Preparado" hint="Palpites e rankings" />
        </section>

        <SystemFooter />
      </div>
    </main>
  )
}
