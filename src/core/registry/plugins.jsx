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
} from "lucide-react";

import HomePage from "../../apps/portal/pages/HomePage";
import PluginPage from "../../shared/layout/PluginPage";
import {
  ChampionshipsPage,
  MatchesPage,
  MatchResultsPage,
  RoundsPage,
  SeasonsPage,
  TeamsPage,
} from "../../modules/competition/admin";
import CompetitionPredictionsPage from "../../modules/competition/predictions/pages/CompetitionPredictionsPage";
import MyPredictionsPage from "../../modules/competition/predictions/pages/MyPredictionsPage";
import MyPredictionResultPage from "../../modules/competition/predictions/pages/MyPredictionResultPage";
import CompetitionRankingPage from "../../modules/competition/ranking/pages/CompetitionRankingPage";
import FootballCenterPage from "../../modules/competition/football/pages/FootballCenterPage";
import FootballMatchDetailsPage from "../../modules/competition/football/pages/FootballMatchDetailsPage";
import FootballTeamPage from "../../modules/competition/football/pages/FootballTeamPage";
import NewsPage from "../../modules/news/pages/NewsPage";
import CommunityPage from "../../modules/community/pages/CommunityPage";
import TVPage from "../../modules/tv/pages/TVPage";
import { TVManager } from "../../modules/tv/admin";
import { RadioAdminPage, RadioPage, XatPreviewPage } from "../../apps/radio";
import BarStudioPage from "../../modules/barstudio/pages/BarStudioPage";
import DesignerPage from "../../modules/barstudio/designer/pages/DesignerPage";
import GamesPage from "../../modules/games/pages/GamesPage";
import BarCoinsPage from "../../modules/barcoins/pages/BarCoinsPage";
import EventsPage from "../../modules/events/pages/EventsPage";
import EventsAdminPage from "../../modules/events/admin/pages/EventsAdminPage";
import ManualPage from "../../modules/manual/pages/ManualPage";
import AdminPage from "../../modules/admin/pages/AdminPage";

const FullScreenChat = React.lazy(() => import("../../modules/chat/pages/FullScreenChat"));

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
    element: <TVPage />,
  },

    {
    id: "radio",
    title: "Rádio",
    path: "/radio",
    icon: Radio,
    menu: true,
    element: <RadioPage />,
  },

  {
    id: "radio-xat",
    title: "Radio xat",
    path: "/radio/xat",
    icon: Radio,
    menu: false,
    element: <XatPreviewPage />,
  },

  {
    id: "radio-admin",
    title: "Radio Admin",
    path: "/radio/admin",
    icon: Shield,
    menu: false,
    element: <RadioAdminPage />,
  },

  {
    id: "football",
    title: "Futebol",
    path: "/football/*",
    icon: Trophy,
    menu: true,
    element: <FootballCenterPage />,
  },

  {
    id: "football-match-details",
    title: "Detalhes da Partida",
    path: "/football/jogos/:matchId",
    icon: Trophy,
    menu: false,
    element: <FootballMatchDetailsPage />,
  },

  {
    id: "football-team-details",
    title: "Time",
    path: "/football/times/:teamId",
    icon: Trophy,
    menu: false,
    element: <FootballTeamPage />,
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
    element: <NewsPage />,
  },

    {
    id: "tools",
    title: "BarStudio",
    path: "/tools",
    icon: Wrench,
    menu: true,
    element: <BarStudioPage />,
  },

  {
    id: "barstudio-designer",
    title: "Designer Pro",
    path: "/barstudio/designer",
    icon: Wrench,
    menu: false,
    element: <DesignerPage />,
  },

    {
    id: "games",
    title: "Brincadeiras",
    path: "/brincadeiras",
    icon: Gamepad2,
    menu: true,
    element: <GamesPage />,
  },

  {
    id: "games-alias",
    title: "Brincadeiras",
    path: "/games",
    icon: Gamepad2,
    menu: false,
    element: <GamesPage />,
  },

  {
    id: "community",
    title: "Comunidade",
    path: "/community",
    icon: Users,
    menu: true,
    element: <CommunityPage />,
  },

    {
    id: "barcoins",
    title: "BarCoins",
    path: "/barcoins",
    icon: Coins,
    menu: true,
    element: <BarCoinsPage />,
  },

    {
    id: "events",
    title: "Eventos",
    path: "/events",
    icon: CalendarDays,
    menu: true,
    element: <EventsPage />,
  },

  {
    id: "events-admin",
    title: "Eventos Admin",
    path: "/events/admin",
    icon: Shield,
    menu: false,
    element: <EventsAdminPage />,
  },

  {
    id: "manual",
    title: "Manual",
    path: "/manual",
    icon: BookOpen,
    menu: true,
    element: <ManualPage />,
  },

  {
    id: "admin",
    title: "Admin",
    path: "/admin",
    icon: Shield,
    menu: false,
    element: <AdminPage />,
  },

  {
    id: "admin-tv",
    title: "TV Manager",
    path: "/admin/tv",
    icon: Tv,
    menu: false,
    element: <TVManager section="dashboard" />,
  },

  {
    id: "admin-tv-categories",
    title: "TV Manager Categorias",
    path: "/admin/tv/categories",
    icon: Tv,
    menu: false,
    element: <TVManager section="categories" />,
  },

  {
    id: "admin-tv-channels",
    title: "TV Manager Canais",
    path: "/admin/tv/channels",
    icon: Tv,
    menu: false,
    element: <TVManager section="channels" />,
  },

  {
    id: "admin-tv-featured",
    title: "TV Manager Destaques",
    path: "/admin/tv/featured",
    icon: Tv,
    menu: false,
    element: <TVManager section="featured" />,
  },

  {
    id: "admin-tv-settings",
    title: "TV Manager Configuracoes",
    path: "/admin/tv/settings",
    icon: Tv,
    menu: false,
    element: <TVManager section="settings" />,
  },

  {
    id: "admin-tv-import",
    title: "TV Manager Importacao",
    path: "/admin/tv/import",
    icon: Tv,
    menu: false,
    element: <TVManager section="import" />,
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
    element: <ChampionshipsPage />,
  },

  {
    id: "admin-competition-seasons",
    title: "Admin Competition Temporadas",
    path: "/admin/competition/temporadas",
    icon: Shield,
    menu: false,
    element: <SeasonsPage />,
  },

  {
    id: "admin-competition-rounds",
    title: "Admin Competition Rodadas",
    path: "/admin/competition/rodadas",
    icon: Shield,
    menu: false,
    element: <RoundsPage />,
  },

  {
    id: "admin-competition-teams",
    title: "Admin Competition Times",
    path: "/admin/competition/times",
    icon: Shield,
    menu: false,
    element: <TeamsPage />,
  },

  {
    id: "admin-competition-matches",
    title: "Admin Competition Jogos",
    path: "/admin/competition/jogos",
    icon: Shield,
    menu: false,
    element: <MatchesPage />,
  },

  {
    id: "admin-competition-results",
    title: "Admin Competition Resultados",
    path: "/admin/competition/resultados",
    icon: Shield,
    menu: false,
    element: <MatchResultsPage />,
  },

  {
    id: "my-prediction-results",
    title: "Meus Palpites",
    path: "/meus-palpites/resultados",
    icon: Trophy,
    menu: false,
    element: <MyPredictionResultPage />,
  },

  {
    id: "competition-predictions",
    title: "Palpites",
    path: "/palpites",
    icon: Trophy,
    menu: true,
    element: <CompetitionPredictionsPage />,
  },

  {
    id: "my-predictions",
    title: "Meus Palpites",
    path: "/meus-palpites",
    icon: Trophy,
    menu: true,
    element: <MyPredictionsPage />,
  },

  {
    id: "competition-ranking",
    title: "Ranking",
    path: "/competition/ranking",
    icon: Trophy,
    menu: true,
    element: <CompetitionRankingPage />,
  },
];

export function getMenuPlugins() {
  return plugins.filter((plugin) => plugin.menu);
}
