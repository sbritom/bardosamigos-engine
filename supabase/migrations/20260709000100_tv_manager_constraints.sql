-- TV Manager v1.0
-- Incremental constraint required for safe featured-channel upserts.

create unique index if not exists tv_featured_channel_unique_idx
  on public.tv_featured (channel_id);
