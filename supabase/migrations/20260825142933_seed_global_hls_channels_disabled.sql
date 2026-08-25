insert into public.tv_channels (
  category_id,
  name,
  slug,
  description,
  provider,
  embed_url,
  country,
  language,
  featured,
  verified,
  enabled,
  display_order,
  availability_scope,
  allowed_countries
)
select
  c.id,
  v.name,
  v.slug,
  v.description,
  'hls-official',
  v.embed_url,
  v.country,
  v.language,
  false,
  true,
  false,
  v.display_order,
  'GLOBAL',
  array[]::text[]
from (values
  ('noticias','Euronews Português','euronews-portugues-global','Notícias internacionais em português. Fonte pública distribuída em HLS.','https://6e52fb8b.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmxheHhUVi1ldV9FdXJvbmV3c1BvcnR1Z3Vlc19ITFM/playlist.m3u8','PT','pt',20),
  ('noticias','ARTV Portugal','artv-portugal-global','Canal parlamentar português com transmissão pública ao vivo.','https://playout175.livextend.cloud/livenlin4/_definst_/2liveartvpub2/playlist.m3u8','PT','pt',21),
  ('tv-aberta','Canal Macau','canal-macau-global','Canal em português da Teledifusão de Macau.','https://globallive.tdm.com.mo/ch2/ch2.live/playlist.m3u8','MO','pt',20),
  ('tv-aberta','TVM Internacional','tvm-internacional-global','Canal internacional da Televisão de Moçambique para públicos dentro e fora do país.','https://stream.tvm.co.mz/hls/tvmi/playlist.m3u8','MZ','pt',21),
  ('noticias','TV BRICS Português','tv-brics-portugues-global','Canal internacional de notícias e atualidades em português.','https://porbrics.mediacdn.ru/cdn/brics/portuguese/tracks-v1a1/mono.ts.m3u8','BR','pt',22),
  ('noticias','NHK World Japan','nhk-world-japan-global','Serviço internacional em inglês da emissora pública japonesa NHK.','https://media-tyo.hls.nhkworld.jp/hls/w/live/master.m3u8','JP','en',23),
  ('variedades','Arirang TV','arirang-tv-global','Canal internacional sul-coreano com cultura, notícias e entretenimento.','https://amdlive-ch01-g-ctnd-com.akamaized.net/arirang_1gch/arirang_1gch.smil/playlist.m3u8','KR','en',20),
  ('noticias','CGTN','cgtn-global','Canal internacional de notícias em inglês.','https://english-livetx.cgtn.com/hls/yypdyyctzb_hd.m3u8','CN','en',24),
  ('especiais','CGTN Documentary','cgtn-documentary-global','Documentários internacionais da CGTN.','https://english-livetx.cgtn.com/hls/yypdjlctzb_hd.m3u8','CN','en',20),
  ('noticias','FRANCE 24 Español','france24-espanol-global','Notícias internacionais 24 horas em espanhol.','https://live.france24.com/hls/live/2037220/F24_ES_HI_HLS/master_5000.m3u8','FR','es',25),
  ('noticias','FRANCE 24 Français','france24-francais-global','Notícias internacionais 24 horas em francês.','https://live.france24.com/hls/live/2037179/F24_FR_HI_HLS/master_5000.m3u8','FR','fr',26),
  ('noticias','teleSUR','telesur-global','Canal latino-americano de notícias em espanhol.','https://mblesmain01.telesur.ultrabase.net/mbliveMain/hd/playlist.m3u8','VE','es',27),
  ('noticias','teleSUR English','telesur-english-global','Canal latino-americano de notícias em inglês.','https://mblenmain01.telesur.ultrabase.net/mblivev3/hd/playlist.m3u8','VE','en',28)
) as v(category_slug,name,slug,description,embed_url,country,language,display_order)
join public.tv_categories c on c.slug = v.category_slug
where not exists (
  select 1
  from public.tv_channels existing
  where lower(existing.slug) = lower(v.slug)
);
