export const profileConfig = {
  name: "Visitante IMORTAL0800",
  nickname: "@visitante",
  joinedAt: "",
  summary: "Personalize sua experiência no IMORTAL0800 escolhendo seus favoritos.",
  avatarFallback: "IM",
}

export const preferenceSections = [
  {
    id: "football-teams",
    title: "Times favoritos",
    description: "Selecione clubes para montar seu futebol.",
    type: "team",
  },
  {
    id: "football-competitions",
    title: "Competições favoritas",
    description: "Acompanhe campeonatos com mais destaque.",
    type: "competition",
  },
  {
    id: "radio",
    title: "Rádio favorita",
    description: "Base preparada para salvar sua rádio principal.",
    type: "radio",
    options: [
      {
        id: "imortal0800-radio",
        label: "Rádio IMORTAL0800",
        meta: "Ao vivo no portal",
      },
    ],
  },
  {
    id: "tv",
    title: "Canal de TV favorito",
    description: "Base preparada para vincular seu canal preferido.",
    type: "tv",
    options: [
      {
        id: "imortal0800-tv",
        label: "TV IMORTAL0800",
        meta: "Catálogo público",
      },
    ],
  },
]

export const settingsSections = [
  {
    id: "theme",
    title: "Tema",
    description: "Preferência visual preparada para persistência futura.",
    options: ["Sistema", "Escuro"],
  },
  {
    id: "language",
    title: "Idioma",
    description: "Idioma principal do portal.",
    options: ["Português do Brasil"],
  },
  {
    id: "sports",
    title: "Preferências esportivas",
    description: "Prioridade para favoritos, competições e jogos ao vivo.",
    options: ["Favoritos primeiro", "Ao vivo primeiro"],
  },
  {
    id: "notifications",
    title: "Notificações",
    description: "Estrutura preparada para avisos futuros.",
    options: ["Jogos ao vivo", "Eventos", "Notícias"],
  },
]

export const forYouSections = [
  {
    id: "football",
    title: "Futebol",
    description: "Jogos e competições favoritos aparecerão aqui.",
  },
  {
    id: "radio",
    title: "Rádio",
    description: "Programações e pedidos salvos aparecerão aqui.",
  },
  {
    id: "tv",
    title: "TV",
    description: "Canais favoritos e destaques aparecerão aqui.",
  },
  {
    id: "news",
    title: "Notícias",
    description: "Temas e fontes favoritos aparecerão aqui.",
  },
]
