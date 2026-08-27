# Segurança — Bar dos Amigos

Última revisão: 27/08/2026

Este documento define a linha de base de segurança do projeto oficial `sbritom/bardosamigos-engine`.

## Fonte oficial

- Repositório: `sbritom/bardosamigos-engine`
- Branch de produção: `main`
- Vercel: `radio-bar-dos-amigos`
- Domínio: `https://www.radiobardosamigos.com.br`
- Supabase: projeto `BarDosAmigos`

## Regras obrigatórias

1. Nunca versionar senhas, tokens, chaves privadas, `service_role` ou credenciais de streaming.
2. Variáveis `VITE_*` podem conter apenas valores destinados ao navegador.
3. `SUPABASE_SERVICE_ROLE_KEY` só pode existir em runtime server-side.
4. Toda tabela pública do Supabase deve permanecer com RLS habilitado.
5. Escritas administrativas devem exigir role validada em `app_metadata` ou autenticação equivalente server-side.
6. Rotas administrativas não podem ser cacheadas nem indexadas.
7. A Radio Engine deve permanecer privada por padrão e seus endpoints internos exigem `RADIO_ENGINE_ADMIN_TOKEN`.
8. O cron de produção deve falhar fechado quando `CRON_SECRET` estiver ausente ou incorreto.
9. Alterações em dependências de produção devem passar em `npm audit --omit=dev --audit-level=high`.
10. O histórico do Git é o backup de código. Não criar cópias `.backup` ou uma segunda aplicação dentro do repositório.

## Proteções ativas

### Vercel / HTTP

- HTTPS + HSTS.
- Content Security Policy.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `frame-ancestors 'none'`.
- Referrer Policy.
- Permissions Policy.
- Origin Agent Cluster.
- Admin com `Cache-Control: private, no-store`.
- Admin com `noindex, nofollow, noarchive`.

### APIs

- CORS/origin validado nas APIs sensíveis.
- Bearer token nas rotas administrativas.
- Limites de payload.
- Cron com `CRON_SECRET` e comparação timing-safe.
- API de futebol com allowlist de competições, janela máxima de datas e timeout externo.
- Proxy de mídia com allowlist de MIME e limite de tamanho.

### Supabase

- RLS habilitado nas tabelas públicas.
- Funções de autorização baseadas em `app_metadata`.
- Eventos em rascunho não são públicos.
- Fluxo administrativo legado de recuperação removido do banco.
- Edge Functions administrativas legadas desativadas e exigindo JWT.
- `service_role` restrito ao servidor.

### Radio Engine

- Bind padrão em `127.0.0.1`.
- Endpoints internos protegidos por `RADIO_ENGINE_ADMIN_TOKEN`.
- WebSocket interno protegido.
- CORS restrito.
- Limite de body.
- Docker exige segredos via ambiente.

### CI

O workflow `Portal Quality` executa:

- `npm ci`
- auditoria de dependências de produção
- testes
- build
- smoke test
- performance budget

## Controles externos ainda obrigatórios

Estes itens dependem de configurações de conta/plataforma e não devem ser substituídos por código:

1. **Rotacionar qualquer credencial de Icecast que já tenha aparecido no histórico Git.**
2. **Supabase Auth:** habilitar proteção contra senhas vazadas, quando disponível no plano.
3. **GitHub:** proteger a branch `main`, exigir o status do `Portal Quality`, bloquear force-push e exclusão.
4. Manter `RADIO_ENGINE_ADMIN_TOKEN`, Icecast e demais segredos apenas no ambiente do servidor.

## Resposta a incidente

Se um segredo for exposto:

1. Revogar/rotacionar o segredo imediatamente.
2. Não considerar a simples remoção do Git suficiente.
3. Revisar logs de acesso.
4. Atualizar ambientes dependentes.
5. Registrar a correção em commit/migration.
6. Executar novamente CI, advisors do Supabase e validação de produção.

## Dependências

Vulnerabilidades HIGH/CRITICAL em dependências de produção bloqueiam o CI. Não remover essa barreira para fazer um deploy passar.
