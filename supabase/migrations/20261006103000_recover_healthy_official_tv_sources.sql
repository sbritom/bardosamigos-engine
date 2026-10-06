update public.tv_channels
set
  enabled = false,
  verified = false,
  updated_at = now()
where provider = 'embed-canais-tv'
  and slug in ('dreamworks', 'hgtv');

update public.tv_channels as channel
set
  enabled = true,
  updated_at = now()
from public.tv_channel_health as health
where health.channel_id = channel.id
  and channel.provider = 'hls-official'
  and channel.verified = true
  and channel.availability_scope = 'GLOBAL'
  and health.status = 'healthy'
  and health.manifest_ok = true
  and health.checked_at >= now() - interval '30 minutes';
