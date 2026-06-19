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
} from "lucide-react";

import HomePage from "../../apps/portal/pages/HomePage";
import PluginPage from "../../shared/layout/PluginPage";

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
];

export function getMenuPlugins() {
  return plugins.filter((plugin) => plugin.menu);
}