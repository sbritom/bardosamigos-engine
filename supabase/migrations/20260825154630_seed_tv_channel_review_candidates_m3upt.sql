with incoming(name) as (
  values
  ('RTP 1'),('RTP 2'),('SIC'),('TVI'),('RTP 3'),('SIC Notícias'),('CNN Portugal'),('Euronews PT'),('ARTV'),('RTP Memória'),('RTP Açores'),('RTP Madeira'),('RTP África'),('RTP Internacional'),('TVI Internacional'),('Porto Canal'),('Euronews EN'),('Euronews ES'),('Euronews IT'),('Euronews FR'),('Euronews DE'),('teleSUR'),('teleSUR English'),('RT News'),('RT America'),('RT UK'),('RT Español'),('RT France'),('RT Documentary'),('CGTN'),('CGTN Español'),('CGTN Français'),('Al Jazeera English'),('France 24 English'),('France 24 Español'),('France 24 Français'),('CNN International'),('Reuters TV'),('NHK World'),('Deutsche Welle Español'),('Deutsche Welle Deutsch'),('Deutsche Welle Arabic'),('TV5 Monde Info'),('TVE 24h'),('La 1'),('La 2'),('Gulli'),('Trace Urban'),('Fuel TV'),('Red Bull TV'),('Fashion TV')
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
  array['LITUATUI/M3UPT'],
  array['https://github.com/LITUATUI/M3UPT'],
  'official','pending',
  'Catalog metadata imported from a directory that states it uses public and official streams; playback URL not stored here.'
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
  authorization_status = case
    when public.tv_channel_candidates.authorization_status in ('unknown','unverified') then 'official'
    else public.tv_channel_candidates.authorization_status
  end,
  updated_at = now();
