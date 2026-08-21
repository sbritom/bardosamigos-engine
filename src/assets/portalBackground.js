import c01 from './portalBgChunk01'
import c02 from './portalBgChunk02'
import c03 from './portalBgChunk03'
import c04 from './portalBgChunk04'
import c05 from './portalBgChunk05'
import c06 from './portalBgChunk06'
import c07 from './portalBgChunk07'
import c08 from './portalBgChunk08'
import c09 from './portalBgChunk09'
import c10 from './portalBgChunk10'

// Chunk 01 was created with 2,000 duplicated characters from the start of chunk 02.
// Keep only its first 8,000 characters so the reconstructed WebP matches the uploaded file exactly.
const portalBackgroundBase64 = `${c01.slice(0, 8000)}${c02}${c03}${c04}${c05}${c06}${c07}${c08}${c09}${c10}`
const portalBackgroundImage = `url("data:image/webp;base64,${portalBackgroundBase64}")`

document.documentElement.style.setProperty('--bds-portal-background-image', portalBackgroundImage)

export default portalBackgroundImage
