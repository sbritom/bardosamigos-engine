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
} from "lucide-react";

import HomePage from "../../apps/portal/pages/HomePage";
import PluginPage from "../../shared/layout/PluginPage";
import {
  ChampionshipsPage,
  MatchesPage,
  RoundsPage,
  SeasonsPage,
  TeamsPage,
} from "../../modules/competition/admin";

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
    element: (
      <PluginPage
        icon="📺"
        title="TV Inteligente"
        description="Sistema de TV Online do Bar dos Amigos."
      />
    ),
  },

  {
    id: "radio",
    title: "Rádio",
    path: "/radio",
    icon: Radio,
    menu: true,
    element: (
      <PluginPage
        icon="📻"
        title="Rádio"
        description="Player persistente e futura Rádio Bar dos Amigos."
      />
    ),
  },

  {
    id: "football",
    title: "Futebol",
    path: "/football",
    icon: Trophy,
    menu: true,
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
    element: (
      <PluginPage
        icon="📰"
        title="Notícias"
        description="Últimas notícias do portal."
      />
    ),
  },

  {
    id: "tools",
    title: "Ferramentas",
    path: "/tools",
    icon: Wrench,
    menu: true,
    element: (
      <PluginPage
        icon="🛠️"
        title="BarStudio"
        description="Ferramentas exclusivas do Bar dos Amigos."
      />
    ),
  },

  {
    id: "games",
    title: "Games",
    path: "/games",
    icon: Gamepad2,
    menu: true,
    element: (
      <PluginPage
        icon="🎮"
        title="Games"
        description="Área gamer do portal."
      />
    ),
  },

  {
    id: "community",
    title: "Comunidade",
    path: "/community",
    icon: Users,
    menu: true,
    element: (
      <PluginPage
        icon="👥"
        title="Comunidade"
        description="Eventos, ranking e interação."
      />
    ),
  },

  {
    id: "barcoins",
    title: "BarCoins",
    path: "/barcoins",
    icon: Coins,
    menu: true,
    element: (
      <PluginPage
        icon="💰"
        title="BarCoins"
        description="Sistema de moedas do portal."
      />
    ),
  },

  {
    id: "events",
    title: "Eventos",
    path: "/events",
    icon: CalendarDays,
    menu: true,
    element: (
      <PluginPage
        icon="📅"
        title="Eventos"
        description="Calendário oficial do Bar dos Amigos."
      />
    ),
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
    menu: true,
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
];

export function getMenuPlugins() {
  return plugins.filter((plugin) => plugin.menu);
}
