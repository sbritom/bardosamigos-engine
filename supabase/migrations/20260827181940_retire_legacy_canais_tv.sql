insert into public.tv_channel_candidates (
  name,
  category_hint,
  source_names,
  source_urls,
  authorization_status,
  review_status,
  notes
)
select
  legacy.name,
  legacy.category_hint,
  array['legacy:canais_tv']::text[],
  legacy.source_urls,
  'unverified',
  'pending',
  'Migrado da tabela legada canais_tv durante a consolidacao do projeto oficial. Fonte ainda precisa de revisao editorial e tecnica.'
from (
  values
    (
      'FIFA TV'::text,
      'Futebol'::text,
      array['https://www.youtube.com/embed/URt8jOImwTw']::text[]
    ),
    (
      'GE TV'::text,
      'Futebol'::text,
      array[]::text[]
    ),
    (
      'Lofi Girl'::text,
      'Musica'::text,
      array['https://www.youtube.com/embed/jfKfPfyJRdk']::text[]
    )
) as legacy(name, category_hint, source_urls)
where not exists (
  select 1
  from public.tv_channels c
  where lower(coalesce(c.name, c.nome, '')) = lower(legacy.name)
     or (
       cardinality(legacy.source_urls) > 0
       and c.embed_url = any(legacy.source_urls)
     )
)
and not exists (
  select 1
  from public.tv_channel_candidates q
  where lower(q.name) = lower(legacy.name)
);

drop table public.canais_tv;
