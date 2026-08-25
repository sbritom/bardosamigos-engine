with incoming(name) as (
  values
  ('Adult Swim'),('A&E'),('Agro+'),('AMC'),('Animal Planet'),('Arte1'),('AXN'),('Band'),('BandNews'),('BIS'),('Canal Brasil'),('Canal OFF'),('Cartoon Network'),('Cartoonito'),('CazéTV'),('CazéTV 2'),('CazéTV 3'),('Cinemax'),('CNN Brasil'),('Combate'),('Curta!'),('Discovery Channel'),('Discovery Home & Health'),('Investigation Discovery'),('Discovery Kids'),('Discovery Science'),('Discovery Theater'),('Discovery Turbo'),('Discovery World'),('E!'),('ESPN'),('ESPN 2'),('ESPN 3'),('ESPN 4'),('ESPN 5'),('ESPN 6'),('Fashion TV'),('Fish TV'),('Food Network'),('Canal Futura'),('Globo SP'),('GloboNews'),('Globoplay Novelas'),('Gloob'),('Gloobinho'),('GNT'),('HBO'),('HBO 2'),('HBO Family'),('HBO Pop'),('HBO Signature'),('HBO Xtreme'),('HBO+'),('HGTV'),('History'),('History 2'),('Jovem Pan News'),('Lifetime'),('Megapix'),('Modo Viagem'),('Multishow'),('NSports'),('Paramount+'),('Paramount+ 2'),('Paramount+ 3'),('Paramount+ 4'),('Premiere Clubes'),('Premiere 2'),('Premiere 3'),('Premiere 4'),('Premiere 5'),('Premiere 6'),('Premiere 7'),('Premiere 8'),('Record SP'),('Record News'),('RedeTV!'),('Sabor & Arte'),('SBT SP'),('SBT News'),('Sony Channel'),('Sony Movies'),('Space'),('SporTV'),('SporTV 2'),('SporTV 3'),('SportyNet'),('SportyNet+ 1'),('SportyNet+ 2'),('SportyNet+ 3'),('Studio Universal'),('Telecine Action'),('Telecine Cult'),('Telecine Fun'),('Telecine Pipoca'),('Telecine Premium'),('Telecine Touch'),('TLC'),('TNT'),('TNT Novelas'),('TNT Séries'),('Tooncast'),('TV Aparecida'),('TV Brasil'),('TV Cultura'),('Universal TV'),('USA Network'),('Warner'),('WooHoo'),('XSports')
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
  array['Rei dos Canais'],
  array['https://reidoscanais.st/canais'],
  'unverified','pending',
  'Imported as catalog metadata only; no playback URL stored.'
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
