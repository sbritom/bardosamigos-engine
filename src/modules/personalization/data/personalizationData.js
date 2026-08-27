export const profileConfig = {
  name: "Visitante do Bar",
  nickname: "@visitante",
  joinedAt: "",
  summary: "Personalize sua experiencia no Portal Bar dos Amigos escolhendo seus favoritos.",
  avatarFallback: "BA",
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
    title: "Competicoes favoritas",
    description: "Acompanhe campeonatos com mais destaque.",
    type: "competition",
  },
  {
    id: "radio",
    title: "Radio favorita",
    description: "Base preparada para salvar sua radio principal.",
    type: "radio",
    options: [
      {
        id: "bar-dos-amigos-radio",
        label: "Radio Bar dos Amigos",
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
        id: "bar-dos-amigos-tv",
        label: "TV Bar dos Amigos",
        meta: "Catalogo publico",
      },
    ],
  },
]

export const settingsSections = [
  {
    id: "theme",
    title: "Tema",
    description: "Preferencia visual preparada para persistencia futura.",
    options: ["Sistema", "Escuro"],
  },
  {
    id: "language",
    title: "Idioma",
    description: "Idioma principal do portal.",
    options: ["Portugues do Brasil"],
  },
  {
    id: "sports",
    title: "Preferencias esportivas",
    description: "Prioridade para favoritos, competicoes e jogos ao vivo.",
    options: ["Favoritos primeiro", "Ao vivo primeiro"],
  },
  {
    id: "notifications",
    title: "Notificacoes",
    description: "Estrutura preparada para avisos futuros.",
    options: ["Jogos ao vivo", "Eventos", "Noticias"],
  },
]

export const forYouSections = [
  {
    id: "football",
    title: "Futebol",
    description: "Jogos e competicoes favoritos aparecerao aqui.",
  },
  {
    id: "radio",
    title: "Radio",
    description: "Programacoes e pedidos salvos aparecerao aqui.",
  },
  {
    id: "tv",
    title: "TV",
    description: "Canais favoritos e destaques aparecerao aqui.",
  },
  {
    id: "news",
    title: "Noticias",
    description: "Temas e fontes favoritos aparecerao aqui.",
  },
]
