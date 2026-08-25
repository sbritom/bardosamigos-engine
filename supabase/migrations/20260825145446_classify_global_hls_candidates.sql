update public.tv_channels
set verified = false,
    availability_scope = 'COUNTRY_LIST',
    allowed_countries = array[]::text[]
where slug in (
  'canal-macau-global',
  'euronews-portugues-global',
  'artv-portugal-global',
  'tvm-internacional-global'
);

update public.tv_channels
set verified = true,
    availability_scope = 'GLOBAL',
    allowed_countries = array[]::text[]
where slug in (
  'arirang-tv-global',
  'cgtn-documentary-global',
  'tv-brics-portugues-global',
  'nhk-world-japan-global',
  'cgtn-global',
  'france24-espanol-global',
  'france24-francais-global',
  'telesur-global',
  'telesur-english-global'
);
