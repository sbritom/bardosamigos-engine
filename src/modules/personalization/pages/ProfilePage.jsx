import { useState } from "react"
import { Bell, LayoutDashboard, Monitor, Radio, Settings, Star, Trophy, Tv, UserRound } from "lucide-react"
import { Button, FeatureCard, StatusBadge } from "../../../design-system"
import { PortalWorkspace, WorkspaceEmptyState, WorkspaceSection } from "../../../shared/workspace"
import {
  MyFootballPanel,
  PersonalizationShell,
  PreferencePanel,
  ProfileSummary,
  SettingsPanel,
} from "../components/PersonalizationComponents"
import { preferenceSections, profileConfig, settingsSections } from "../data/personalizationData"

const profileViews = {
  profile: {
    title: "Meu Perfil",
    description: "Informacoes basicas da sua experiencia no portal.",
  },
  favorites: {
    title: "Favoritos",
    description: "Base organizada para times, competicoes, radios, TV e noticias.",
  },
  football: {
    title: "Meu Futebol",
    description: "Partidas reais vinculadas aos seus favoritos.",
  },
  tv: {
    title: "Minha TV",
    description: "Estrutura para canais favoritos e ultimo canal acessado.",
  },
  radio: {
    title: "Minha Radio",
    description: "Estrutura para radio favorita e ultimos acessos.",
  },
  competitions: {
    title: "Competicoes",
    description: "Competicoes favoritas, proximas partidas e resultados.",
  },
  preferences: {
    title: "Preferencias",
    description: "Tema, idioma, esportes e layout preparados para persistencia futura.",
  },
  notifications: {
    title: "Notificacoes",
    description: "Estrutura visual para futuras notificacoes do portal.",
  },
}

const favoriteGroups = [
  { id: "teams", title: "Times", description: "Times favoritos aparecerao aqui." },
  { id: "competitions", title: "Competicoes", description: "Competicoes favoritas aparecerao aqui." },
  { id: "radios", title: "Radios", description: "Radios favoritas aparecerao aqui." },
  { id: "tv", title: "TV", description: "Canais favoritos aparecerao aqui." },
  { id: "news", title: "Noticias", description: "Temas e noticias favoritas aparecerao aqui." },
]

const notificationGroups = [
  { id: "games", title: "Jogos", description: "Avisos de partidas e placares." },
  { id: "events", title: "Eventos", description: "Lembretes de eventos do Bar." },
  { id: "news", title: "Noticias", description: "Alertas de publicacoes relevantes." },
  { id: "radio", title: "Radio", description: "Programacao e destaques da radio." },
  { id: "tv", title: "TV", description: "Canais e conteudos em destaque." },
]

function ProfileOverview() {
  return (
    <div className="bds-personalization-main">
      <ProfileSummary profile={profileConfig} />
      <FeatureCard
        className="bds-personalization-card"
        icon={<UserRound size={18} />}
        title="Editar Perfil"
        description="Placeholder visual preparado para edicao futura."
        action={<StatusBadge status="Em breve" tone="soon" />}
      >
        <Button disabled variant="secondary">Editar Perfil</Button>
      </FeatureCard>
    </div>
  )
}

function FavoritesPanel() {
  return (
    <section className="bds-personalization-grid">
      {favoriteGroups.map((group) => (
        <FeatureCard
          key={group.id}
          className="bds-personalization-card"
          icon={<Star size={18} />}
          title={group.title}
          description={group.description}
        >
          <WorkspaceEmptyState title="Nenhum favorito encontrado." />
        </FeatureCard>
      ))}
    </section>
  )
}

function TvPanel() {
  return (
    <section className="bds-personalization-grid">
      <FeatureCard className="bds-personalization-card" icon={<Tv size={18} />} title="Canais favoritos" description="Canais salvos aparecerao aqui.">
        <WorkspaceEmptyState title="Nenhum canal favorito encontrado." />
      </FeatureCard>
      <FeatureCard className="bds-personalization-card" icon={<Monitor size={18} />} title="Ultimo canal acessado" description="Estrutura preparada para dados futuros.">
        <WorkspaceEmptyState title="Nenhum canal acessado." />
      </FeatureCard>
    </section>
  )
}

function RadioPanel() {
  return (
    <section className="bds-personalization-grid">
      <FeatureCard className="bds-personalization-card" icon={<Radio size={18} />} title="Radio favorita" description="Radio principal do perfil.">
        <WorkspaceEmptyState title="Nenhuma radio favorita encontrada." />
      </FeatureCard>
      <FeatureCard className="bds-personalization-card" icon={<LayoutDashboard size={18} />} title="Ultimas radios acessadas" description="Historico preparado para evolucao futura.">
        <WorkspaceEmptyState title="Nenhum acesso encontrado." />
      </FeatureCard>
    </section>
  )
}

function CompetitionsPanel() {
  return (
    <div className="bds-personalization-main">
      <PreferencePanel sections={preferenceSections.filter((section) => section.type === "competition")} />
      <MyFootballPanel />
    </div>
  )
}

function PreferencesPanel() {
  return (
    <div className="bds-personalization-main">
      <SettingsPanel sections={settingsSections.filter((section) => section.id !== "notifications")} />
      <PreferencePanel sections={preferenceSections} />
    </div>
  )
}

function NotificationsPanel() {
  return (
    <section className="bds-personalization-grid">
      {notificationGroups.map((group) => (
        <FeatureCard
          key={group.id}
          className="bds-personalization-card"
          icon={<Bell size={18} />}
          title={group.title}
          description={group.description}
          action={<StatusBadge status="Estrutura" tone="info" />}
        >
          <WorkspaceEmptyState title="Nenhuma notificacao configurada." />
        </FeatureCard>
      ))}
    </section>
  )
}

export default function ProfilePage() {
  const [activeView, setActiveView] = useState("profile")
  const view = profileViews[activeView]

  function renderContent() {
    if (activeView === "profile") return <ProfileOverview />
    if (activeView === "favorites") return <FavoritesPanel />
    if (activeView === "football") return <MyFootballPanel />
    if (activeView === "tv") return <TvPanel />
    if (activeView === "radio") return <RadioPanel />
    if (activeView === "competitions") return <CompetitionsPanel />
    if (activeView === "preferences") return <PreferencesPanel />
    return <NotificationsPanel />
  }

  const sidebarItems = [
    { id: "profile", icon: UserRound, name: "Meu Perfil" },
    { id: "favorites", icon: Star, name: "Favoritos" },
    { id: "football", icon: Trophy, name: "Meu Futebol" },
    { id: "tv", icon: Tv, name: "Minha TV" },
    { id: "radio", icon: Radio, name: "Minha Radio" },
    { id: "competitions", icon: Trophy, name: "Competicoes" },
    { id: "preferences", icon: Settings, name: "Preferencias" },
    { id: "notifications", icon: Bell, name: "Notificacoes" },
  ]

  return (
    <PersonalizationShell
      eyebrow="Perfil e preferencias"
      title="Sua area no Bar dos Amigos"
      description="Uma base limpa para favoritos, preferencias e conteudo personalizado."
      icon={<UserRound size={40} />}
    >
      <PortalWorkspace
        header={{
          eyebrow: "Perfil",
          title: view.title,
          description: view.description,
        }}
        sidebar={{
          title: "Perfil",
          items: sidebarItems,
          selectedId: activeView,
          onSelect: (item) => setActiveView(item.id),
        }}
        content={{ title: view.title, description: view.description }}
      >
        <WorkspaceSection>
          {renderContent()}
        </WorkspaceSection>
      </PortalWorkspace>
    </PersonalizationShell>
  )
}
