import {
  Tv,
  Radio,
  Trophy,
  Newspaper,
  Wrench,
  Gamepad2,
  Users,
  Coins,
  MessageCircle,
  Play,
} from "lucide-react";

import Container from "../../../shared/layout/Container";
import PortalCard from "../../../shared/cards/PortalCard";
import Button from "../../../shared/buttons/Button";
import Hero from "../layouts/Hero";

const quickItems = [
  { icon: Tv, title: "TV Inteligente", subtitle: "Assista agora" },
  { icon: Radio, title: "Rádio", subtitle: "Ouça agora" },
  { icon: Trophy, title: "Futebol", subtitle: "Jogos e resultados" },
  { icon: Newspaper, title: "Notícias", subtitle: "Atualidades" },
  { icon: Wrench, title: "BarStudio", subtitle: "Ferramentas" },
  { icon: Gamepad2, title: "Games", subtitle: "Novidades" },
  { icon: Users, title: "Comunidade", subtitle: "Eventos" },
  { icon: Coins, title: "BarCoins", subtitle: "Missões" },
];

const tools = [
  "Avatar",
  "NameColor",
  "Banner",
  "Magic Cut",
  "Hospedar",
  "Converter",
  "QR Code",
  "IA Imagem",
];

const news = [
  "Brasil vence amistoso com show dos atacantes",
  "Nova música bate recorde nas rádios",
  "Festival de São João confirma atrações",
  "Free Fire anuncia nova temporada",
];

const games = ["Free Fire", "Fortnite", "Minecraft", "Roblox"];

export default function HomePage() {
  return (
    <main className="pb-6">
      <Container className="space-y-4">
        <section className="rounded-[18px] border border-[var(--border)] bg-[linear-gradient(90deg,#0a0a0a,#17110a,#050505)] p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <div className="mb-2 text-xs font-black uppercase text-[var(--gold)]">
                🍺 Bar dos Amigos
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-tight md:text-5xl">
                Aqui a <span className="text-[var(--gold)]">diversão</span>
                <br />
                nunca para!
              </h1>

              <p className="mt-3 max-w-2xl text-[var(--secondary)]">
                Rádio, TV, futebol, notícias, ferramentas e comunidade em um só
                lugar.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button>📺 Assistir TV</Button>
                <Button variant="ghost">💬 Entrar no Chat</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quickItems.slice(0, 4).map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[18px] border border-[var(--border)] bg-black/70 p-4 text-center"
                  >
                    <Icon
                      size={34}
                      className="mx-auto mb-3 text-[var(--gold)]"
                    />
                    <div className="text-sm font-black text-[var(--gold)]">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs text-[var(--secondary)]">
                      {item.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-12">
          <PortalCard
            title="Chat Online"
            icon="💬"
            className="min-h-[420px] lg:col-span-6"
          >
            <div className="space-y-3">
              {["AlambiqueXP", "GIAN", "Garçon", "Silent", "BiaLinda"].map(
                (name, index) => (
                  <div
                    key={name}
                    className="flex items-start gap-3 rounded-xl bg-black p-3"
                  >
                    <div className="h-10 w-10 rounded-full bg-[var(--gold)]/20" />
                    <div className="flex-1">
                      <div className="font-black">{name}</div>
                      <div className="text-sm text-[var(--secondary)]">
                        {index === 0
                          ? "O smiley está diante de você!"
                          : "Seja bem-vindo ao Bar dos Amigos!"}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--secondary)]">
                      20:{30 - index}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-[var(--border)] bg-black px-4 py-3 outline-none"
                placeholder="Digite sua mensagem..."
              />
              <Button>➤</Button>
            </div>
          </PortalCard>

          <PortalCard
            title="TV Ao Vivo"
            icon="📺"
            action={<button className="text-sm text-[var(--gold)]">Ver todos</button>}
            className="min-h-[420px] lg:col-span-6"
          >
            <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
              <div className="relative overflow-hidden rounded-[18px] border border-[var(--border)] bg-black">
                <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#1a1a1a,#050505)]">
                  <div className="text-center">
                    <Play size={54} className="mx-auto text-[var(--gold)]" />
                    <div className="mt-3 text-3xl font-black">
                      FUTEBOL <span className="text-[var(--gold)]">AO VIVO</span>
                    </div>
                    <div className="mt-2 text-sm text-[var(--secondary)]">
                      Assista agora
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {["Futebol Ao Vivo", "Música Ao Vivo", "Eventos Ao Vivo", "Filmes 24h"].map(
                  (item) => (
                    <button
                      key={item}
                      className="w-full rounded-xl border border-[var(--border)] bg-black p-3 text-left text-sm font-bold hover:border-[var(--gold)]"
                    >
                      <span className="text-[var(--gold)]">●</span> {item}
                    </button>
                  )
                )}
              </div>
            </div>
          </PortalCard>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {quickItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <Icon size={30} className="mb-3 text-[var(--gold)]" />
                <div className="font-black">{item.title}</div>
                <div className="text-sm text-[var(--secondary)]">
                  {item.subtitle}
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <PortalCard title="Central do Futebol" icon="⚽" className="min-h-[320px]">
            <div className="rounded-xl bg-black p-4 text-center">
              <div className="text-xs font-black text-[var(--gold)]">
                BRASILEIRÃO SÉRIE A
              </div>
              <div className="mt-4 grid grid-cols-3 items-center">
                <div>Flamengo</div>
                <div className="text-3xl font-black">VS</div>
                <div>Palmeiras</div>
              </div>
              <Button className="mt-5">Ver detalhes</Button>
            </div>
          </PortalCard>

          <PortalCard title="Últimas Notícias" icon="📰" className="min-h-[320px]">
            <div className="space-y-3">
              {news.map((item) => (
                <div key={item} className="rounded-xl bg-black p-3">
                  <div className="text-xs font-black text-[var(--gold)]">
                    NOTÍCIA
                  </div>
                  <div className="mt-1 font-bold">{item}</div>
                </div>
              ))}
            </div>
          </PortalCard>

          <PortalCard title="Rádio / Música" icon="🎵" className="min-h-[320px]">
            <div className="rounded-xl border border-[var(--border)] bg-black p-4">
              <div className="text-xs font-black text-[var(--gold)]">
                TOCANDO AGORA
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--gold)]/20">
                  🎧
                </div>
                <div className="flex-1">
                  <div className="font-black">Rádio Bar dos Amigos</div>
                  <div className="text-sm text-[var(--secondary)]">
                    Programação ao vivo
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                    <div className="h-full w-2/3 bg-[var(--gold)]" />
                  </div>
                </div>
              </div>
            </div>
          </PortalCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
          <PortalCard title="Ferramentas / BarStudio" icon="🛠️">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {tools.map((tool) => (
                <button
                  key={tool}
                  className="rounded-xl border border-[var(--border)] bg-black p-5 text-center font-black hover:border-[var(--gold)]"
                >
                  {tool}
                </button>
              ))}
            </div>
          </PortalCard>

          <PortalCard title="Games / Comunidade" icon="🎮">
            <div className="grid grid-cols-2 gap-3">
              {games.map((game) => (
                <div
                  key={game}
                  className="flex min-h-[85px] items-end rounded-xl border border-[var(--border)] bg-black p-4 font-black"
                >
                  {game}
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-[var(--border)] bg-black p-4">
              <div className="font-black text-[var(--gold)]">
                Comunidade ativa
              </div>
              <div className="text-sm text-[var(--secondary)]">
                Eventos, ranking, missões e interação.
              </div>
            </div>
          </PortalCard>
        </section>
      </Container>
    </main>
  );
}