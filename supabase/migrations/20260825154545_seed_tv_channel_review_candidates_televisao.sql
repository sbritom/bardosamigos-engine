with incoming(name) as (
  values
  ('SBT'),('TV Brasil'),('TV Brasil Internacional'),('TVI'),('TVI Reality'),('TVI Ficção'),('Band'),('RedeTV!'),('Rede Brasil'),('CNN BRASIL'),('CNN Portugal'),('Record News'),('Jovem Pan News'),('Canal Gov'),('TV Pampa'),('Euronews'),('Folha Política'),('TV Cultura'),('Rede CNT'),('TVE Brasil'),('TV Meio Norte'),('DiaTV'),('SIC'),('Rede Família'),('Rede Super'),('TV Carioca'),('TV Senado'),('TV Jornal'),('Agrobrasil'),('Rede Premium TV'),('Demais TV'),('TV Guarulhos'),('TV Mais Brasil'),('TV CNB'),('Loading'),('TV Aracati'),('TV Assembléia MT'),('Canal 25'),('Rede NGT'),('TV Aratu'),('Sesc TV'),('Rede Minas'),('TV Arapuan'),('Araruna TV'),('TV Tropical'),('TVitapê'),('Rede Metrópole'),('Rede QDM'),('COM Brasil'),('Boa Vontade TV'),('Boas Novas'),('Master TV'),('TV A Folha'),('TV Brusque'),('TV Canal Dez'),('TV Grande Natal'),('TV WTJMINAS'),('TV Planalto Norte'),('ISTV'),('Nova Era TV'),('Adesso TV'),('Rede UTV'),('Extremo Oriental TV'),('TV MAX'),('TV Capital'),('TV Zimbo'),('TPA Internacional'),('Muzangala TV'),('KKTV'),('SBT News'),('BM&C NEWS'),('REDE TV ES'),('TV Fórum'),('1001 Noites'),('TV Sol'),('TV Globo'),('Canal Saúde'),('Canal TV Rio'),('TV Metropolitana Rio'),('All Sports'),('ABC Brasil'),('Rede Smart'),('TV Mon HD'),('Cariri TV'),('Kuriakos Kids'),('Pocoyo'),('Bluey'),('Peppa Pig'),('Léo o caminhão'),('Tom e Jerry'),('Om Nom'),('Simon Super Coelho'),('Detetive Labrador'),('Família de Gatos'),('Desenhos de Carros'),('3 Palavrinhas'),('A Bruxinha Tatty'),('Hophop a coruja'),('Wolfoo'),('Booba'),('LooLoo Kids'),('PJ Masks'),('Mr. Bean'),('Patrulha Canina'),('Polly Pocket'),('Giramille'),('Nickelodeon'),('YoNeo'),('TVI África'),('RTP1'),('RTP2'),('RTP3'),('Trace Brasil'),('Trace Latina'),('Trace Urban'),('Kpop TV Play'),('THE K-POP'),('Afrobeats TV'),('DBM TV'),('KroneHit TV'),('m2o TV'),('REDEVIDA'),('TV Maná Brasil'),('TV Justiça'),('Conta Lá'),('TaDaBoom'),('TV Guararapes'),('IPP TV'),('Esquece Isso!'),('TV Evangelizar'),('TV Gazeta'),('TV Gazeta de Alagoas'),('TV Novo Tempo'),('TV Pai Eterno'),('SBT Rio'),('SBT RP'),('SCC SBT'),('SBT Brasília'),('TV Ponta Verde SBT'),('TH+ SBT Vale'),('Difusora SBT'),('RadioU TV'),('ALL THE K-POP'),('Retro Cartoon'),('Anime TV'),('Otaku Sign TV'),('Pica Pau'),('Gospel Cartoon'),('MI TV'),('Power Rangers'),('TV Adorando Jesus'),('Toon Goggles'),('My Little Pony em Português'),('MBC'),('Geekdot'),('Terraviva'),('Bellator MMA'),('PVL'),('RJ Motorsport'),('RIO TV Câmara'),('Numberblocks'),('Filmes Online'),('GLN TV'),('Sony One Cinema'),('CinePIX TV'),('Web TV Cine'),('TV Clássicos do Cinema'),('Clouding TV'),('Classique TV'),('Lucas TV'),('Grjngo'),('CHANNEL 1'),('Gospel Movie TV'),('R Ação'),('R Cinema'),('R Comédia'),('R Crime'),('R Família'),('R Romance'),('Sony One Emoções'),('Sessão Trash'),('Rakuten TV Português'),('Rakuten TV Family'),('Classique Western'),('MyTime'),('Cindie TV'),('Kuriakos Cine'),('Filmelier TV'),('TNJ'),('TV Recordações Web CE'),('TV Cidade Brasil'),('TV Vargem'),('Crime e Investigação'),('Christmas TV'),('Wording TV'),('CATÓLICA TV'),('Jetsons TV'),('Séries Classic'),('Z Nation'),('Cine Brasil'),('Doramas TV'),('Top TV'),('Alpha FM'),('89 A Rádio Rock'),('Seven TV'),('Music TOP'),('Planeta TV'),('Top Latino TV'),('Kiss TV'),('ON FM Portugal'),('The Country Network'),('AGITOMAX'),('Rede Blitz'),('Retro Plus TV'),('That''s 70s'),('That''s 80s'),('That''s 90s00s'),('That''s Rock'),('ROCK TV'),('TV Central do Brasil'),('Retro Music Television'),('Deluxe Music'),('TV 538'),('Stingray Classica'),('Vevo ''70s'),('Vevo ''80s'),('Vevo ''90s'),('Vevo 2K'),('Brit Asia TV'),('TV Café Viola'),('TV Rock Brasil'),('Sony One Shark Tank Brasil'),('Nature Time Brasil'),('Hardcore Pawn'),('Canal Futura'),('Canal Educação'),('TV Poços'),('TCM 10'),('TV Aberta'),('TV Futuro'),('TV Câmara'),('TV Mega Brasil'),('TV Cultura do Pará'),('TVC Panorama'),('TV Aparecida'),('TV Canção Nova'),('TV Horizonte'),('TV Novo Milênio'),('REDEVIDA Mais'),('REDEVIDA de Educação'),('Paróquia São João Batista'),('TV Vianney'),('Santa Cruz Web TV'),('Kuriakos TV'),('Rede Século 21'),('RIT TV'),('TV Universal'),('Igreja Mundial do Poder de Deus'),('Rede Mais Família'),('TV Rede Gospel'),('TVCI'),('TV Feliz'),('TV Templo'),('Gospel Music'),('TV Sonora'),('Fonte TV'),('Rede Brasil de Comunicação'),('Som Que Alimenta'),('Show da Fé'),('Way TV'),('ADB TV'),('Rede Universo TV'),('TV Adorador Gospel'),('TV Sepiol'),('Plenitude TV'),('TV Reconcavo'),('Semear TV'),('IURDTV'),('Igreja Online'),('TV Maanaim'),('Rádio Fonte Viva Gospel'),('Rede Alfa'),('SBC'),('SBC Pipoca'),('SBC Studios'),('SBC Kids'),('Drive Channel TV'),('MEGA ONE TV'),('TV ExpllosãoFM'),('Caravana Play'),('OS DETETIVES'),('Comedy Club'),('MIAMI VICE'),('TV Miura'),('VRT Channel'),('CINE CATÁSTROFE'),('TVCEI'),('TV DIFUSÃO'),('TV Sonata'),('TV MZ'),('TVNA Filmes'),('Reviva TV'),('TV Channel Network'),('AWTV'),('Rede Novelas')
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
  name, category_hint, source_names, source_urls,
  authorization_status, review_status, notes
)
select n.name, null,
  array['Televisão.TV'],
  array['https://televisao.tv/'],
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
