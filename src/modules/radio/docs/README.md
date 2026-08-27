# Bar Radio Engine v1.0

## Objetivo

Modulo completo de radio online para o Bar dos Amigos Engine, preparado para operar com Icecast proprio, Shoutcast ou streaming externo alterando apenas configuracoes.

## Estrutura

```text
src/modules/radio/
  radio/
  admin/
  components/
  pages/
  hooks/
  services/
  store/
  utils/
  config/
  api/
  styles/
  assets/
```

## Implementado

- Dashboard operacional.
- Biblioteca com busca, filtros e modo grade/lista.
- Upload com area drag and drop preparada.
- Categorias padrao.
- Playlists com duracao total.
- Programacao semanal.
- AutoDJ configuravel em mocks.
- Player premium com HTML5 audio.
- Streaming preparado para Icecast, Shoutcast e externo.
- Tocando agora, historico e proximas musicas.
- Ouvintes e estatisticas com mocks.
- Logs e configuracoes.

## Sprint 2

- Persistir dados no Supabase.
- Integrar provedor BRLOGIC/Icecast real.
- Extrair metadados reais de audio.
- Implementar upload real com storage.
- Criar rotas dedicadas de admin se desejado.
- Adicionar virtualizacao real para listas grandes.
