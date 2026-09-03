# IMORTAL0800

Portal de entretenimento 24h com TV, Futebol, Games, Rádio e Comunidade/Xat.

## Identidade

- Nome: **IMORTAL0800**
- Slogan: **Entretenimento 24h**
- Domínio oficial planejado: `https://imortal0800.com`
- Xat oficial: `https://xat.com/Imortal0800`

## Áreas principais

- `/` — Início
- `/tv` — TV
- `/football` — Futebol
- `/games` — Games
- `/radio` — Rádio
- `/community` — Comunidade
- `/chat` — Xat oficial
- `/events` — Eventos
- `/admin` — Administração

## Rádio

A Rádio IMORTAL0800 usa o stream `https://s01.svrdedicado.org:7956/stream`. Metadados e ouvintes são consumidos por `/api/radio/stats`; pedidos musicais usam `/api/radio/requests`.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação antes de produção:

```bash
npm run quality:portal
```

O comando executa testes do portal, build, smoke check e orçamento do bundle.

## Arquitetura

Frontend em React/Vite, Supabase para dados e autenticação, e Vercel para hospedagem e funções serverless. O projeto é mantido dentro do limite de 12 funções Node do plano atual da Vercel.

## Projeto

Todo conteúdo, identidade visual, textos, URLs públicas e recursos do portal devem usar exclusivamente a marca **IMORTAL0800**.
