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
  CalendarDays,
  Shield,
  MessageCircle,
  UserRound,
  Sparkles,
  Settings,
} from "lucide-react";

import AdminRouteGuard from "../auth/AdminRouteGuard";
import { ADMIN_ROLES } from "../auth/adminAuthService";
import PluginPage from "../../shared/layout/PluginPage";

const HomePage = React.lazy(() => import("../../apps/portal/pages/HomePage"));
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
const CommunityAdminPage = React.lazy(() => import("../../modules/community/admin/CommunityAdminPage"));
const DesignerPage = React.lazy(() => import("../../modules/barstudio/designer/pages/DesignerPage"));
const GamesPage = React.lazy(() => import("../../modules/games/pages/GamesPage"));
const EventsPage = React.lazy(() => import("../../modules/events/pages/EventsPage"));
const EventsAdminPage = React.lazy(() => import("../../modules/events/admin/pages/EventsAdminPage"));
const AdminPage = React.lazy(() => import("../../modules/admin/pages/AdminPage"));
const AdminUsersPage = React.lazy(() => import("../../modules/admin/pages/AdminUsersPage"));
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

const ProfilePage = React.lazy(() => import("../../modules/personalization/pages/ProfilePage"));
const ForYouPage = React.lazy(() => import("../../modules/personalization/pages/ForYouPage"));
const SettingsPage = React.lazy(() => import("../../modules/personalization/pages/SettingsPage"));

const ADMIN_ONLY_ROLES = Object.freeze([ADMIN_ROLES.ADMIN]);
const RADIO_ADMIN_ROLES = Object.freeze([ADMIN_ROLES.ADMIN, ADMIN_ROLES.LOCUTOR]);

function LazyPluginPage({ component: Component, title, description, ...props }) {
  return (
    <React.Suspense fallback={<PluginPage title={title} description={description || `Carregando ${title}...`} />}>
      <Component {...props} />
    </React.Suspense>
  );
}

function AdminPluginPage({ component, title, allowedRoles = ADMIN_ONLY_ROLES, ...props }) {
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
    element: <LazyPluginPage component={HomePage} title="Home" />,
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
    title: "Rádio Xat",
    path: "/radio/xat",
    icon: Radio,
    menu: false,
    element: <LazyPluginPage component={XatPreviewPage} title="Rádio Xat" />,
  },

  {
    id: "radio-admin",
    title: "Painel da Rádio",
    path: "/radio/admin",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={RadioAdminPage} title="Painel da Rádio" allowedRoles={RADIO_ADMIN_ROLES} />,
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
    id: "news",
    title: "Notícias",
    path: "/news",
    icon: Newspaper,
    menu: false,
    element: <LazyPluginPage component={NewsPage} title="Notícias" />,
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
    title: "Games",
    path: "/games",
    icon: Gamepad2,
    menu: true,
    element: <LazyPluginPage component={GamesPage} title="Games" />,
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
    title: "Para Você",
    path: "/for-you",
    icon: Sparkles,
    menu: false,
    element: <LazyPluginPage component={ForYouPage} title="Para Você" />,
  },

  {
    id: "settings",
    title: "Configurações",
    path: "/settings",
    icon: Settings,
    menu: false,
    element: <LazyPluginPage component={SettingsPage} title="Configurações" />,
  },

  {
    id: "events",
    title: "Eventos",
    path: "/events",
    icon: CalendarDays,
    menu: false,
    element: <LazyPluginPage component={EventsPage} title="Eventos" />,
  },

  {
    id: "community-admin",
    title: "Comunidade Admin",
    path: "/admin/community",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={CommunityAdminPage} title="Comunidade Admin" />,
  },

  {
    id: "events-admin",
    title: "Eventos Admin",
    path: "/admin/events",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={EventsAdminPage} title="Eventos Admin" />,
  },

  {
    id: "admin",
    title: "Administração",
    path: "/admin",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={AdminPage} title="Administração" />,
  },

  {
    id: "admin-users",
    title: "Usuários",
    path: "/admin/users",
    icon: Shield,
    menu: false,
    element: <AdminPluginPage component={AdminUsersPage} title="Usuários" />,
  },

  {
    id: "admin-tv",
    title: "TV Admin",
    path: "/admin/tv",
    icon: Tv,
    menu: false,
    element: <AdminPluginPage component={TVManager} title="TV Admin" />,
  },

  {
    id: "admin-championships",
    title: "Campeonatos",
    path: "/admin/competitions",
    icon: Trophy,
    menu: false,
    element: <AdminPluginPage component={ChampionshipsPage} title="Campeonatos" />,
  },

  {
    id: "admin-seasons",
    title: "Temporadas",
    path: "/admin/competitions/seasons",
    icon: Trophy,
    menu: false,
    element: <AdminPluginPage component={SeasonsPage} title="Temporadas" />,
  },

  {
    id: "admin-rounds",
    title: "Rodadas",
    path: "/admin/competitions/rounds",
    icon: Trophy,
    menu: false,
    element: <AdminPluginPage component={RoundsPage} title="Rodadas" />,
  },

  {
    id: "admin-teams",
    title: "Times",
    path: "/admin/competitions/teams",
    icon: Trophy,
    menu: false,
    element: <AdminPluginPage component={TeamsPage} title="Times" />,
  },

  {
    id: "admin-matches",
    title: "Partidas",
    path: "/admin/competitions/matches",
    icon: Trophy,
    menu: false,
    element: <AdminPluginPage component={MatchesPage} title="Partidas" />,
  },

  {
    id: "admin-results",
    title: "Resultados",
    path: "/admin/competitions/results",
    icon: Trophy,
    menu: false,
    element: <AdminPluginPage component={MatchResultsPage} title="Resultados" />,
  },

  {
    id: "predictions",
    title: "Palpites",
    path: "/palpites",
    icon: Trophy,
    menu: false,
    element: <LazyPluginPage component={CompetitionPredictionsPage} title="Palpites" />,
  },

  {
    id: "my-predictions",
    title: "Meus Palpites",
    path: "/meus-palpites",
    icon: Trophy,
    menu: false,
    element: <LazyPluginPage component={CompetitionPredictionsPage} title="Meus Palpites" initialTab="mine" />,
  },

  {
    id: "ranking",
    title: "Ranking",
    path: "/ranking",
    icon: Trophy,
    menu: false,
    element: <LazyPluginPage component={CompetitionPredictionsPage} title="Ranking" initialTab="ranking" />,
  },

  {
    id: "chat",
    title: "Chat",
    path: "/chat",
    icon: MessageCircle,
    menu: false,
    element: <LazyPluginPage component={FullScreenChat} title="Chat" />,
  },
];
