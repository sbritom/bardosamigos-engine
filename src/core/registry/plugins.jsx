import React from "react";

import {
  Home,
  Tv,
  Radio,
  Trophy,
  Newspaper,
  Wrench,
  Gamepad2,
  Users,
  Coins,
  CalendarDays,
  Shield,
  MessageCircle,
  BookOpen,
  UserRound,
  Sparkles,
  Settings,
} from "lucide-react";

import HomePage from "../../apps/portal/pages/HomePage";
import AdminRouteGuard from "../auth/AdminRouteGuard";
import { ADMIN_ROLES } from "../auth/adminAuthService";
import PluginPage from "../../shared/layout/PluginPage";

const FullScreenChat = React.lazy(() => import("../../modules/chat/pages/FullScreenChat"));
const TVPage = React.lazy(() => import("../../modules/tv/pages/TVPage"));
const RadioPage = React.lazy(() => import("../../apps/radio/RadioPage"));
const XatPreviewPage = React.lazy(() => import("../../apps/radio/XatPreviewPage"));
const RadioAdminPage = React.lazy(() => import("../../apps/radio/admin/RadioAdminPage"));
const FootballCenterPage = React.lazy(() => import("../../modules/competition/football/pages/FootballCenterPage"));
const FootballMatchDetailsPage = React.lazy(() => import("../../modules/competition/football/pages/FootballMatchDetailsPage"));
const FootballTeamPage = React.lazy(() => import("../../modules/competition/football/pages/FootballTeamPage"));
const NewsPage = React.lazy(() => import("../../modules/news/pages/NewsPage"));
const CommunityPage = React.lazy(() => import("../../modules/community/pages/CommunityPage"));
const BarStudioPage = React.lazy(() => import("../../modules/barstudio/pages/BarStudioPage"));
const DesignerPage = React.lazy(() => import("../../modules/barstudio/designer/pages/DesignerPage"));
const GamesPage = React.lazy(() => import("../../modules/games/pages/GamesPage"));
const BarCoinsPage = React.lazy(() => import("../../modules/barcoins/pages/BarCoinsPage"));
const EventsPage = React.lazy(() => import("../../modules/events/pages/EventsPage"));
const EventsAdminPage = React.lazy(() => import("../../modules/events/admin/pages/EventsAdminPage"));
const ManualPage = React.lazy(() => import("../../modules/manual/pages/ManualPage"));
const AdminPage = React.lazy(() => import("../../modules/admin/pages/AdminPage"));
const TVManager = React.lazy(() =>
  import("../../modules/tv/admin/TVManager").then((module) => ({ default: module.TVManager })),
);
const ChampionshipsPage = React.lazy(() => import("../../modules/competition/admin/pages/ChampionshipsPage"));
const SeasonsPage = React.lazy(() => import("../../modules/competition/admin/pages/SeasonsPage"));
const RoundsPage = React.lazy(() => import("../../modules/competition/admin/pages/RoundsPage"));
const TeamsPage = React.lazy(() => import("../../modules/competition/admin/pages/TeamsPage"));
const MatchesPage = React.lazy(() => import("../../modules/competition/admin/pages/MatchesPage"));
const MatchResultsPage = React.lazy(() => import("../../modules/competition/admin/pages/MatchResultsPage"));
const CompetitionPredictionsPage = React.lazy(() =>
  import("../../modules/competition/predictions/pages/CompetitionPredictionsPage"),
);
const MyPredictionsPage = React.lazy(() => import("../../modules/competition/predictions/pages/MyPredictionsPage"));
const MyPredictionResultPage = React.lazy(() =>
  import("../../modules/competition/predictions/pages/MyPredictionResultPage"),
);
const CompetitionRankingPage = React.lazy(() => import("../../modules/competition/ranking/pages/CompetitionRankingPage"));
const ProfilePage = React.lazy(() => import("../../modules/personalization/pages/ProfilePage"));
const ForYouPage = React.lazy(() => import("../../modules/personalization/pages/ForYouPage"));
const SettingsPage = React.lazy(() => import("../../modules/personalization/pages/SettingsPage"));

function LazyPluginPage({ component: Component, title, description, ...props }) {
  return (
    <React.Suspense fallback={<PluginPage title={title} description={description || `Carregando ${title}...`} />}>
      <Component {...props} />
    </React.Suspense>
  );
}

function AdminPluginPage({ component, title, allowedRoles = [ADMIN_ROLES.ADMIN], ...props }) {
  return (
    <AdminRouteGuard allowedRoles={allowedRoles} title={title}>
      <LazyPluginPage component={component} title={title} {...props} />
    </AdminRouteGuard>
  );
}

export const plugins = [
  {
    id: "home",
    title: "Home",
    path: "/",
    icon: Home,
    menu: true,
    element: <HomePage />,
  },

  {
    id: "tv",
    title: "TV",
    path: "/tv",
    icon: Tv,
    menu: true,
    element: <LazyPluginPage component={TVPage} title="TV" />,
  },

  {
    id: "radio",
    title: "Rádio",
    path: "/radio",
    icon: Radio,
    menu: true,
    element: <LazyPluginPage component={RadioPage} title="Rádio" />,
  },

  {
    id: "radio-xat",
    title: "Radio xat",
    path: "/radio/xat",
    icon: Radio,
    menu: false,
    element: <LazyPluginPage component={XatPreviewPage} title="Radio xat" />,
  },

  {
    id: "radio-admin",
    title: "Radio Admin",
    path: "/radio/admin",
    icon: Shield,
    menu: false,
    element: (
      <AdminPluginPage
        component={RadioAdminPage}
        title="Radio Admin"
        allowedRoles={[ADMIN_ROLES.ADMIN, ADMIN_ROLES.LOCUTOR]}
      />
    ),
  },

  {
    id: "football",
    title: "Futebol",
    path: "/football/*",
    icon: Trophy,
    menu: true,
    element: <LazyPluginPage component={FootballCenterPage} title="Futebol" />,
  },

  {
    id: "football-match-details",
    title: "Detalhes da Partida",
    path: "/football/jogos/:matchId",
    icon: Trophy,
    menu: false,
    element: <LazyPluginPage component={FootballMatchDetailsPage} title="Detalhes da Partida" />,
  },

  {
    id: "football-team-details",
    title: "Time",
    path: "/football/times/:teamId",
    icon: Trophy,
    menu: false,
    element: <LazyPluginPage component={FootballTeamPage} title="Time" />,
  },

  {
    id: "football-placeholder",
    title: "Futebol",
    path: "/football-placeholder",
    icon: Trophy,
    menu: false,
    element: (
      <PluginPage
        icon="⚽"
        title="Central do Futebol"
        description="Jogos ao vivo, resultados e classificações."
      />
    ),
  },

  {
    id: "news",
    title: "Notícias",
    path: "/news",
    icon: Newspaper,
    menu: true,
    element: <LazyPluginPage component={NewsPage} title="Notícias" />,
  },

  {
    id: "tools",
    title: "BarStudio",
    path: "/tools",
    icon: Wrench,
    menu: true,
    element: <LazyPluginPage component={BarStudioPage} title="BarStudio" />,
  },

  {
    id: "barstudio-designer",
    title: "Designer Pro",
    path: "/barstudio/designer",
    icon: Wrench,
    menu: false,
    element: <LazyPluginPage component={DesignerPage} title="Designer Pro" />,
  },

  {
    id: "games",
    title: "Brincadeiras",
    path: "/brincadeiras",
    icon: Gamepad2,
    menu: true,
    element: <LazyPluginPage component={GamesPage} title="Brincadeiras" />,
  },

  {
    id: "games-alias",
    title: "Brincadeiras",
    path: "/games",
    icon: Gamepad2,
    menu: false,
    element: <LazyPluginPage component={GamesPage} title="Brincadeiras" />,
  },

  {
    id: "community",
    title: "Comunidade",
    path: "/community",
    icon: Users,
    menu: true,
    element: <LazyPluginPage component={CommunityPage} title="Comunidade" />,
  },

  {
    id: "profile",
    title: "Perfil",
    path: "/profile",
    icon: UserRound,
    menu: false,
    element: <LazyPluginPage component={ProfilePage} title="Perfil" />,
  },

  {
    id: "for-you",
    title: "Para Voce",
    path: "/for-you",
    icon: Sparkles,
    menu: false,
    element: <LazyPluginPage component={ForYouPage} title="Para Voce" />,
  },

  {
    id: "settings",
    title: "Configuracoes",
    path: "/settings",
    icon: Settings,
    menu: false,
    element: <LazyPluginPage component={SettingsPage} title="Configuracoes" />,
  },

  {
    id: "barcoins",
    title: "BarCoins",
    path: "/barcoins",
    icon: Coins,
    menu: true,
    element: <LazyPluginPage component={BarCoinsPage} title="BarCoins" />,
  },

  {
    id: "events",
    title: "Eventos",
    path: "/events",
    icon: CalendarDays,
    menu: true,
    element: <LazyPluginPage component={EventsPage} title="Eventos" />,
  },

  {
    id: "events-admin",
    title: "Eventos Admin",
    path: "/events/admin",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={EventsAdminPage} title="Eventos Admin" />,
  },

  {
    id: "manual",
    title: "Manual",
    path: "/manual",
    icon: BookOpen,
    menu: true,
    element: <LazyPluginPage component={ManualPage} title="Manual" />,
  },

  {
    id: "admin",
    title: "Admin",
    path: "/admin",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={AdminPage} title="Admin" />,
  },

  {
    id: "admin-tv",
    title: "TV Manager",
    path: "/admin/tv",
    icon: Tv,
    menu: false,
    element: <AdminPluginPage component={TVManager} title="TV Manager" section="dashboard" />,
  },

  {
    id: "admin-tv-categories",
    title: "TV Manager Categorias",
    path: "/admin/tv/categories",
    icon: Tv,
    menu: false,
    element: <AdminPluginPage component={TVManager} title="TV Manager Categorias" section="categories" />,
  },

  {
    id: "admin-tv-channels",
    title: "TV Manager Canais",
    path: "/admin/tv/channels",
    icon: Tv,
    menu: false,
    element: <AdminPluginPage component={TVManager} title="TV Manager Canais" section="channels" />,
  },

  {
    id: "admin-tv-featured",
    title: "TV Manager Destaques",
    path: "/admin/tv/featured",
    icon: Tv,
    menu: false,
    element: <AdminPluginPage component={TVManager} title="TV Manager Destaques" section="featured" />,
  },

  {
    id: "admin-tv-settings",
    title: "TV Manager Configuracoes",
    path: "/admin/tv/settings",
    icon: Tv,
    menu: false,
    element: <AdminPluginPage component={TVManager} title="TV Manager Configurações" section="settings" />,
  },

  {
    id: "admin-tv-import",
    title: "TV Manager Importacao",
    path: "/admin/tv/import",
    icon: Tv,
    menu: false,
    element: <AdminPluginPage component={TVManager} title="TV Manager Importação" section="import" />,
  },

  {
    id: "official-chat",
    title: "Chat",
    path: "/chat",
    icon: MessageCircle,
    menu: true,
    element: (
      <React.Suspense fallback={<PluginPage title="Chat" description="Carregando chat oficial..." />}>
        <FullScreenChat />
      </React.Suspense>
    ),
  },

  {
    id: "admin-competition",
    title: "Admin Competition",
    path: "/admin/competition/campeonatos",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={ChampionshipsPage} title="Admin Competition" />,
  },

  {
    id: "admin-competition-seasons",
    title: "Admin Competition Temporadas",
    path: "/admin/competition/temporadas",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={SeasonsPage} title="Admin Competition Temporadas" />,
  },

  {
    id: "admin-competition-rounds",
    title: "Admin Competition Rodadas",
    path: "/admin/competition/rodadas",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={RoundsPage} title="Admin Competition Rodadas" />,
  },

  {
    id: "admin-competition-teams",
    title: "Admin Competition Times",
    path: "/admin/competition/times",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={TeamsPage} title="Admin Competition Times" />,
  },

  {
    id: "admin-competition-matches",
    title: "Admin Competition Jogos",
    path: "/admin/competition/jogos",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={MatchesPage} title="Admin Competition Jogos" />,
  },

  {
    id: "admin-competition-results",
    title: "Admin Competition Resultados",
    path: "/admin/competition/resultados",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={MatchResultsPage} title="Admin Competition Resultados" />,
  },

  {
    id: "my-prediction-results",
    title: "Meus Palpites",
    path: "/meus-palpites/resultados",
    icon: Trophy,
    menu: false,
    element: <LazyPluginPage component={MyPredictionResultPage} title="Meus Palpites" />,
  },

  {
    id: "competition-predictions",
    title: "Palpites",
    path: "/palpites",
    icon: Trophy,
    menu: true,
    element: <LazyPluginPage component={CompetitionPredictionsPage} title="Palpites" />,
  },

  {
    id: "my-predictions",
    title: "Meus Palpites",
    path: "/meus-palpites",
    icon: Trophy,
    menu: true,
    element: <LazyPluginPage component={MyPredictionsPage} title="Meus Palpites" />,
  },

  {
    id: "competition-ranking",
    title: "Ranking",
    path: "/competition/ranking",
    icon: Trophy,
    menu: true,
    element: <LazyPluginPage component={CompetitionRankingPage} title="Ranking" />,
  },
];

export function getMenuPlugins() {
  return plugins.filter((plugin) => plugin.menu);
}
