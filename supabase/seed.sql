insert into public.admin_roles (name, slug, description, permissions)
values
  ('Administrador', 'admin', 'Acesso administrativo geral.', '{"admin": true}'::jsonb),
  ('Moderador', 'moderator', 'Acesso de moderacao de conteudo.', '{"moderation": true}'::jsonb)
on conflict (slug) do nothing;

insert into public.feature_flags (key, module, enabled, description)
values
  ('barai.enabled', 'barai', false, 'Habilita recursos publicos do BarAI.'),
  ('competition.enabled', 'competition', false, 'Habilita recursos publicos do Bar Competition Engine.'),
  ('barcoins.enabled', 'barcoins', false, 'Habilita economia BarCoins.'),
  ('store.enabled', 'store', false, 'Habilita loja.'),
  ('missions.enabled', 'missions', false, 'Habilita missoes.')
on conflict (key) do nothing;

insert into public.app_settings (key, value, scope, is_public)
values
  ('platform.name', '"Bar dos Amigos Engine"'::jsonb, 'global', true),
  ('platform.theme', '"dark"'::jsonb, 'global', true),
  ('security.soft_delete', 'true'::jsonb, 'global', false)
on conflict (key) do nothing;

insert into public.barcoin_rules (name, source_module, event_type, amount, limits, is_active)
values
  ('Boas-vindas', 'profile', 'profile.created', 100, '{"once": true}'::jsonb, false),
  ('Palpite pontuado', 'competition', 'prediction.scored', 10, '{"daily": 100}'::jsonb, false)
on conflict do nothing;
