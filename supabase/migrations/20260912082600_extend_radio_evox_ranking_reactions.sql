alter table public.radio_evox_ranking
  add column if not exists songs_evaluated integer not null default 0 check (songs_evaluated >= 0),
  add column if not exists likes_count integer not null default 0 check (likes_count >= 0),
  add column if not exists approval_percent integer not null default 0 check (approval_percent >= 0 and approval_percent <= 100),
  add column if not exists total_reactions integer not null default 0 check (total_reactions >= 0),
  add column if not exists most_liked jsonb not null default '{}'::jsonb check (jsonb_typeof(most_liked) = 'object'),
  add column if not exists most_favorited jsonb not null default '{}'::jsonb check (jsonb_typeof(most_favorited) = 'object'),
  add column if not exists most_rejected jsonb not null default '{}'::jsonb check (jsonb_typeof(most_rejected) = 'object');
