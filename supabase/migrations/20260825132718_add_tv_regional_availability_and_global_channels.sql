-- TV regional availability.
-- Existing embed-canais-tv catalog remains available in Brazil only.
-- Official international streams are added as GLOBAL candidates.

alter table public.tv_channels
  add column if not exists availability_scope text not null default 'GLOBAL';

alter table public.tv_channels
  add column if not exists allowed_countries text[] not null default '{}'::text[];

alter table public.tv_channels
  drop constraint if exists tv_channels_availability_scope_check;

alter table public.tv_channels
  add constraint tv_channels_availability_scope_check
  check (availability_scope in ('GLOBAL', 'BR_ONLY', 'COUNTRY_LIST'));

update public.tv_channels
set availability_scope = 'BR_ONLY',
    allowed_countries = array['BR']::text[],
    updated_at = now()
where provider = 'embed-canais-tv';

with news_category as (
  select id from public.tv_categories where slug = 'noticias' limit 1
)
insert into public.tv_channels (
  category_id, name, slug, description, provider, embed_url, country, language,
  featured, verified, enabled, display_order, availability_scope, allowed_countries
)
select id, 'FRANCE 24 English', 'france24-english', 'Transmissão oficial internacional 24/7 da FRANCE 24.',
  'youtube-official', 'https://www.youtube-nocookie.com/embed/Ap-UM1O9RBU?rel=0', 'FR', 'en',
  false, true, true, 500, 'GLOBAL', '{}'::text[]
from news_category
where not exists (select 1 from public.tv_channels where lower(slug) = 'france24-english');

with news_category as (
  select id from public.tv_categories where slug = 'noticias' limit 1
)
insert into public.tv_channels (
  category_id, name, slug, description, provider, embed_url, country, language,
  featured, verified, enabled, display_order, availability_scope, allowed_countries
)
select id, 'Al Jazeera English', 'al-jazeera-english', 'Transmissão oficial internacional ao vivo da Al Jazeera English.',
  'youtube-official', 'https://www.youtube-nocookie.com/embed/gCNeDWCI0vo?rel=0', 'QA', 'en',
  false, true, true, 501, 'GLOBAL', '{}'::text[]
from news_category
where not exists (select 1 from public.tv_channels where lower(slug) = 'al-jazeera-english');

with news_category as (
  select id from public.tv_categories where slug = 'noticias' limit 1
)
insert into public.tv_channels (
  category_id, name, slug, description, provider, embed_url, country, language,
  featured, verified, enabled, display_order, availability_scope, allowed_countries
)
select id, 'DW News', 'dw-news', 'Transmissão oficial ao vivo da Deutsche Welle em inglês.',
  'youtube-official', 'https://www.youtube-nocookie.com/embed/qMtcWqCL_UQ?rel=0', 'DE', 'en',
  false, true, true, 502, 'GLOBAL', '{}'::text[]
from news_category
where not exists (select 1 from public.tv_channels where lower(slug) = 'dw-news');

with news_category as (
  select id from public.tv_categories where slug = 'noticias' limit 1
)
insert into public.tv_channels (
  category_id, name, slug, description, provider, embed_url, country, language,
  featured, verified, enabled, display_order, availability_scope, allowed_countries
)
select id, 'Bloomberg Television', 'bloomberg-television', 'Transmissão oficial ao vivo de notícias de negócios e mercados.',
  'youtube-official', 'https://www.youtube-nocookie.com/embed/iyOq8DhaMYw?rel=0', 'US', 'en',
  false, true, true, 503, 'GLOBAL', '{}'::text[]
from news_category
where not exists (select 1 from public.tv_channels where lower(slug) = 'bloomberg-television');

with news_category as (
  select id from public.tv_categories where slug = 'noticias' limit 1
)
insert into public.tv_channels (
  category_id, name, slug, description, provider, embed_url, country, language,
  featured, verified, enabled, display_order, availability_scope, allowed_countries
)
select id, 'Euronews English', 'euronews-english', 'Transmissão oficial internacional 24/7 da Euronews em inglês.',
  'youtube-official', 'https://www.youtube-nocookie.com/embed/pykpO5kQJ98?rel=0', 'FR', 'en',
  false, true, true, 504, 'GLOBAL', '{}'::text[]
from news_category
where not exists (select 1 from public.tv_channels where lower(slug) = 'euronews-english');

with specials_category as (
  select id from public.tv_categories where slug = 'especiais' limit 1
)
insert into public.tv_channels (
  category_id, name, slug, description, provider, embed_url, country, language,
  featured, verified, enabled, display_order, availability_scope, allowed_countries
)
select id, 'NASA Media', 'nasa-media', 'Transmissão oficial do canal de mídia da NASA.',
  'youtube-official', 'https://www.youtube-nocookie.com/embed/P11y8N22Rq0?rel=0', 'US', 'en',
  false, true, true, 505, 'GLOBAL', '{}'::text[]
from specials_category
where not exists (select 1 from public.tv_channels where lower(slug) = 'nasa-media');
