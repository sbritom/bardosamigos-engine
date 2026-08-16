const SAFE_FILENAME = /^[a-f0-9]{13}\.(png|jpe?g|webp|avif|gif|svg)$/i

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end()
  }

  const filename = String(req.query?.filename || '')
  if (!SAFE_FILENAME.test(filename)) return res.status(404).end()

  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const bucket = process.env.VITE_SUPABASE_STORAGE_BUCKET || 'media'
  if (!supabaseUrl) return res.status(503).end()

  const target = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/barstudio/${encodeURIComponent(filename)}`
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  return res.redirect(307, target)
}
