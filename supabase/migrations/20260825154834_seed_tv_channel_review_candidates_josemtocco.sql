with incoming(name) as (
  values
  ('TV Difusão'),('Conect + TV'),('N Sports'),('Nature Time'),('TV Gaucha'),('Adesso TV'),('Animation +'),('Bem Melhor'),('Canal Educação'),('CANAL LIKE'),('Canal Plural'),('Cazé TV'),('Conecta Mais'),('Filmelier'),('GE TV'),('Grjngo'),('Hallo Séries'),('Hallo! Doc'),('Hallo! Movies'),('Love Nature'),('New Brasil'),('NGT'),('Petlovers TV'),('Porto Alegre 24 horas'),('REISEN CLUBE TV'),('Royal World'),('RSPlay TV'),('RunTime Cine Espanto'),('RunTime Comédia'),('RunTime Crime'),('RunTime Familia'),('RunTime Romance'),('Sony One Cinema'),('Tastemade Viagens'),('Toon Google'),('Turma da Monica'),('TV Clube'),('TV Diário de Santa Maria'),('TV Erga Omnes'),('TV EXPLOSÃO SÉRIES'),('TV Metropolitana'),('TV NBN'),('TV Pampa'),('TV Passo Fundo'),('TV Santa Maria'),('Tv Top Mix Filmes'),('TV Zoom'),('TVE'),('UNIQUE TRAVEL AND FOOD'),('Urban Movies HD'),('Urban TV Docs HD'),('Urban TV Kids HD'),('Urban TV Retro HD'),('Urban TV Travel HD'),('Urban TV Turbo HD'),('Vambora Channel'),('VEJA+'),('Bob Esponja - 24h'),('Adrenalina Pura TV'),('ADRENALINA PURA TV HALLOWEEN'),('Auge TV'),('FILMELIER TV'),('HALLO MOVIE'),('Hallo! Classic'),('MOVIE SPHERE'),('POA Streeming'),('TVL News')
),
normalized as (
  select name,
    lower(regexp_replace(translate(name,
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
      'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'),
      '[^a-zA-Z0-9]+','','g')) as normalized_name
  from incoming
),
existing as (
  select lower(regexp_replace(translate(coalesce(name,''),
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
      'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'),
      '[^a-zA-Z0-9]+','','g')) as normalized_name
  from public.tv_channels
)
insert into public.tv_channel_candidates (
  name, source_names, source_urls, authorization_status, review_status, notes
)
select n.name,
  array['josemtocco/TV'],
  array['https://github.com/josemtocco/TV/blob/main/Canais.m3u'],
  'unverified','pending',
  'Imported as catalog metadata only; no playlist or playback URL stored.'
from normalized n
where n.normalized_name <> ''
  and not exists (select 1 from existing e where e.normalized_name = n.normalized_name)
on conflict (normalized_name) do update set
  source_names = (
    select array_agg(distinct x order by x)
    from unnest(public.tv_channel_candidates.source_names || excluded.source_names) as t(x)
  ),
  source_urls = (
    select array_agg(distinct x order by x)
    from unnest(public.tv_channel_candidates.source_urls || excluded.source_urls) as t(x)
  ),
  updated_at = now();
