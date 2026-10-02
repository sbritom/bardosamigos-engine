import {
  Home,
  Tv,
  Radio,
  Trophy,
  Newspaper,
  Wrench,
  Gamepad2,
  Users,
  Calendar,
  Settings,
  Shield,
} from "lucide-react";

export default [
  { title: "Home", icon: Home, path: "/" },
  { title: "TV", icon: Tv, path: "/tv" },
  { title: "Rádio", icon: Radio, path: "/radio" },
  { title: "Futebol", icon: Trophy, path: "/football" },
  { title: "Notícias", icon: Newspaper, path: "/news" },
  { title: "Ferramentas", icon: Wrench, path: "/tools" },
  { title: "Games", icon: Gamepad2, path: "/games" },
  { title: "Comunidade", icon: Users, path: "/community" },
  { title: "Eventos", icon: Calendar, path: "/events" },
  { title: "Admin", icon: Shield, path: "/admin" },
  { title: "Configurações", icon: Settings, path: "/settings" },
];
