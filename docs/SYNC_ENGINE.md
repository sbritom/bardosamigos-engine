# Sync Engine v1

O Sync Engine e a camada oficial para integrar APIs externas ao Bar dos Amigos Engine.

Fluxo:

API Externa -> Sync Engine -> Supabase -> Competition/Home/Noticias

## Responsabilidades

- Isolar chamadas externas fora dos modulos do portal.
- Normalizar dados externos com mappers.
- Persistir dados sincronizados no Supabase.
- Manter cache em memoria para evitar chamadas repetidas.
- Registrar ultima sincronizacao, quantidade de registros e erros.
- Permitir fallback usando dados ja sincronizados no Supabase.

## Estrutura

- `adapters/`: conectores externos, sem fetcher real por padrao.
- `mappers/`: convertem payload externo para o formato interno.
- `repositories/`: persistem dados no Supabase.
- `services/`: orquestram cada sincronizacao.
- `admin/`: prepara status, logs e acao "sincronizar agora".
- `cache/`: cache simples em memoria.

## Integracoes Preparadas

- Campeonatos -> `competitions`
- Jogos -> `competition_matches`
- Classificacao -> `ranking_entries`
- Noticias -> `news_articles`
- Football-Data.org -> competicoes, times, jogos e classificacao via provider dedicado
- GNews -> noticias de Futebol, Esportes e Brasil via provider dedicado

## Seguranca

O frontend nao deve chamar APIs externas diretamente. A Home e os demais modulos devem continuar lendo apenas dados do Supabase.

Nenhuma chave privada deve ser exposta no frontend. Chaves de APIs externas devem ficar em ambiente server-side quando forem conectadas.

## Proximos Passos

1. Criar execucao server-side do Sync Engine.
2. Conectar fetchers reais por provider.
3. Criar migrations especificas para logs/configuracoes de sincronizacao se necessario.
4. Finalizar painel admin com status, logs e acao manual.
5. Agendar sincronizacoes recorrentes.
