with incoming(name) as (
  values
  ('RTP 1'),('RTP 2'),('SIC'),('TVI'),('CMTV'),('SIC Notícias'),('RTP 3'),('CNN Portugal'),('Porto Canal'),
  ('Sport TV 1'),('Sport TV 2'),('Sport TV 3'),('Sport TV 4'),('Sport TV 5'),('Sport TV 6'),('Benfica TV'),('Sporting TV'),('Eleven Sports'),('Eurosport 1'),('Eurosport 2'),('NBA TV'),
  ('Globo SP'),('Record SP'),('SBT SP'),('Band SP'),('Telefe'),('El Trece'),('TVN Chile'),('Canal 13 Chile'),('TVE'),('Antena 3'),('Telecinco'),('TF1'),('France 2'),('Canal+'),('BBC'),('ITV'),('Sky'),
  ('RTP Memória'),('RTP África'),('RTP Internacional'),('SIC Radical'),('SIC Mulher'),('SIC K'),('TVI24'),('TVI Ficção'),('TVI Reality')
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
  array['Tuga TV'],
  array['https://tuga-iptv.com/lista-iptv-portugal-completa/'],
  'unverified','pending',
  'Imported as catalog metadata only from a commercial IPTV catalog; no playback URL or service credential stored.'
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
