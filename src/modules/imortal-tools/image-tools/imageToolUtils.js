export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif'
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif']
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024

export function validateImageFile(file, { types = IMAGE_TYPES, formatMessage = 'Use uma imagem PNG, JPG, JPEG, WEBP ou AVIF.' } = {}) {
  if (!file) return 'Selecione uma imagem.'
  if (!types.includes(file.type)) return formatMessage
  if (file.size > MAX_IMAGE_SIZE) return 'A imagem deve ter no máximo 20 MB.'
  return ''
}

export function loadImageFile(file, validationOptions) {
  return new Promise((resolve, reject) => {
    const validationError = validateImageFile(file, validationOptions)
    if (validationError) {
      reject(new Error(validationError))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const element = new Image()
    element.decoding = 'async'
    element.onload = () => resolve({ element, file, name: file.name, src: objectUrl })
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível abrir a imagem. Verifique se o arquivo não está corrompido.'))
    }
    element.src = objectUrl
  })
}

export function revokeLoadedImage(image) {
  if (image?.src?.startsWith('blob:')) URL.revokeObjectURL(image.src)
}

export function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Não foi possível gerar a imagem.'))
    }, type, quality)
  })
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.download = filename
  anchor.href = url
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyImageBlob(blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Seu navegador não permite copiar imagens diretamente.')
  }
  const pngBlob = blob.type === 'image/png' ? blob : new Blob([await blob.arrayBuffer()], { type: blob.type })
  await navigator.clipboard.write([new ClipboardItem({ [pngBlob.type]: pngBlob })])
}

export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(Number(value) || 0, minimum), maximum)
}

export function formatBytes(value) {
  const bytes = Number(value) || 0
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`
}

export function normalizeHex(value) {
  const source = String(value || '').trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(source)) return `#${source.split('').map((part) => part + part).join('').toUpperCase()}`
  if (/^[0-9a-f]{6}$/i.test(source)) return `#${source.toUpperCase()}`
  return null
}

export function hexToRgb(hex) {
  const normalized = normalizeHex(hex) || '#000000'
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
}

export function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export function rgbToHsl({ r, g, b }) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  let hue = 0
  let saturation = 0

  if (max !== min) {
    const delta = max - min
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0)
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
    hue /= 6
  }

  return { h: Math.round(hue * 360), s: Math.round(saturation * 100), l: Math.round(lightness * 100) }
}

export function hslToHex(h, s, l) {
  const hue = ((Number(h) % 360) + 360) % 360
  const saturation = clamp(s, 0, 100) / 100
  const lightness = clamp(l, 0, 100) / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const section = hue / 60
  const secondary = chroma * (1 - Math.abs((section % 2) - 1))
  const [red, green, blue] = section < 1 ? [chroma, secondary, 0]
    : section < 2 ? [secondary, chroma, 0]
      : section < 3 ? [0, chroma, secondary]
        : section < 4 ? [0, secondary, chroma]
          : section < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary]
  const match = lightness - chroma / 2
  return rgbToHex((red + match) * 255, (green + match) * 255, (blue + match) * 255)
}

export function formatColor(hex, format) {
  const normalized = normalizeHex(hex) || '#000000'
  const rgb = hexToRgb(normalized)
  if (format === 'rgb') return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  if (format === 'hsl') {
    const hsl = rgbToHsl(rgb)
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  }
  return normalized
}

export function parseColor(value, format) {
  if (format === 'hex') return normalizeHex(value)
  const numbers = String(value || '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) || []
  if (numbers.length < 3) return null
  return format === 'rgb' ? rgbToHex(numbers[0], numbers[1], numbers[2]) : hslToHex(numbers[0], numbers[1], numbers[2])
}
