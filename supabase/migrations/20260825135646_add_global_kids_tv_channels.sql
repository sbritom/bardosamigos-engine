with infantil as (
  select id
  from public.tv_categories
  where slug = 'infantil'
  limit 1
), catalog(name, slug, description, embed_url, language, display_order) as (
  values
    ('WB Kids', 'wb-kids-global', 'Desenhos clássicos e conteúdo infantil oficial da Warner Bros., com lives quando disponíveis.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UC9trsD1jCTXXtN3xIOIU8gg&rel=0', 'en', 100),
    ('BabyTV', 'babytv-global', 'Conteúdo pré-escolar oficial do BabyTV, com músicas, desenhos e lives quando disponíveis.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCGxnmQJquvQwlV_ICDfAKNA&rel=0', 'en', 110),
    ('Peppa Pig', 'peppa-pig-global', 'Episódios e conteúdo infantil do canal oficial Peppa Pig, com live quando disponível.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCAOtE1V7Ots4DjM8JLlrYgg&rel=0', 'en', 120),
    ('WildBrain Zoo', 'wildbrain-zoo-global', 'Desenhos infantis oficiais da WildBrain, incluindo lives e maratonas quando disponíveis.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCYej-juCoKZ6WAwWtqaD_EA&rel=0', 'en', 130)
)
update public.tv_channels as channel
set
  category_id = infantil.id,
  name = catalog.name,
  description = catalog.description,
  provider = 'youtube-official',
  embed_url = catalog.embed_url,
  country = null,
  language = catalog.language,
  featured = false,
  verified = true,
  enabled = true,
  display_order = catalog.display_order,
  availability_scope = 'GLOBAL',
  allowed_countries = array[]::text[],
  updated_at = now()
from catalog, infantil
where lower(channel.slug) = lower(catalog.slug);

with infantil as (
  select id
  from public.tv_categories
  where slug = 'infantil'
  limit 1
), catalog(name, slug, description, embed_url, language, display_order) as (
  values
    ('WB Kids', 'wb-kids-global', 'Desenhos clássicos e conteúdo infantil oficial da Warner Bros., com lives quando disponíveis.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UC9trsD1jCTXXtN3xIOIU8gg&rel=0', 'en', 100),
    ('BabyTV', 'babytv-global', 'Conteúdo pré-escolar oficial do BabyTV, com músicas, desenhos e lives quando disponíveis.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCGxnmQJquvQwlV_ICDfAKNA&rel=0', 'en', 110),
    ('Peppa Pig', 'peppa-pig-global', 'Episódios e conteúdo infantil do canal oficial Peppa Pig, com live quando disponível.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCAOtE1V7Ots4DjM8JLlrYgg&rel=0', 'en', 120),
    ('WildBrain Zoo', 'wildbrain-zoo-global', 'Desenhos infantis oficiais da WildBrain, incluindo lives e maratonas quando disponíveis.', 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCYej-juCoKZ6WAwWtqaD_EA&rel=0', 'en', 130)
)
insert into public.tv_channels (
  category_id, name, slug, description, provider, embed_url, country, language,
  featured, verified, enabled, display_order, availability_scope, allowed_countries
)
select
  infantil.id, catalog.name, catalog.slug, catalog.description, 'youtube-official',
  catalog.embed_url, null, catalog.language, false, true, true,
  catalog.display_order, 'GLOBAL', array[]::text[]
from catalog
cross join infantil
where not exists (
  select 1 from public.tv_channels existing where lower(existing.slug) = lower(catalog.slug)
);
