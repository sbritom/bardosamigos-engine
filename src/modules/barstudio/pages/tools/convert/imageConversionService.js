import { canvasToBlob, EXPORT_FORMATS, renderImagePreview } from '../../../image-tools'

export const CONVERTER_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/svg+xml'
export const CONVERTER_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif', 'image/svg+xml']
export const CONVERTER_FORMAT_MESSAGE = 'Use uma imagem PNG, JPG, JPEG, WEBP, AVIF ou SVG.'

export const CONVERSION_FORMATS = {
  png: { label: 'PNG', description: 'Transparência e qualidade sem perdas.', mime: 'image/png' },
  jpg: { label: 'JPG', description: 'Melhor compatibilidade entre plataformas.', mime: 'image/jpeg' },
  webp: { label: 'WEBP', description: 'Arquivo menor com ótima qualidade.', mime: 'image/webp' },
  avif: { label: 'AVIF', description: 'Melhor compressão em navegadores compatíveis.', mime: 'image/avif' },
}

export const METADATA_NOTICE = 'Navegadores não preservam metadados ao redesenhar imagens no Canvas. A exportação será gerada sem metadados.'

export function getImageFormatLabel(mime) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'JPG'
  if (mime === 'image/svg+xml') return 'SVG'
  return String(mime || '').replace('image/', '').toUpperCase() || 'Desconhecido'
}

export function getConversionQualityValue(quality) {
  return quality === 'original' ? 1 : Math.min(1, Math.max(0.5, Number(quality) / 100))
}

export async function isCanvasFormatSupported(format) {
  if (format !== 'avif') return true
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const blob = await canvasToBlob(canvas, CONVERSION_FORMATS[format].mime, 0.8)
  return blob.type === CONVERSION_FORMATS[format].mime
}

export async function convertImage({ image, format, quality, background, outputWidth, outputHeight }) {
  const config = EXPORT_FORMATS[format]
  if (!config) throw new Error('Formato de saída não suportado.')
  const canvas = document.createElement('canvas')
  renderImagePreview(canvas, {
    image,
    outputWidth,
    outputHeight,
    fit: 'stretch',
    shape: 'square',
    background,
    edgeInset: 0,
    format,
    quality: quality === 'original' ? 'high' : Number(quality) <= 60 ? 'low' : Number(quality) <= 80 ? 'medium' : 'high',
  })
  const blob = await canvasToBlob(canvas, config.mime, getConversionQualityValue(quality))
  if (blob.type !== config.mime) throw new Error(`${CONVERSION_FORMATS[format].label} não está disponível para exportação neste navegador.`)
  return { blob, width: canvas.width, height: canvas.height, mime: config.mime }
}

export async function estimateConvertedSize(options) {
  const sourceWidth = options.image.naturalWidth || options.image.width
  const sourceHeight = options.image.naturalHeight || options.image.height
  const scale = Math.min(1, 1200 / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const converted = await convertImage({ ...options, outputWidth: width, outputHeight: height })
  const pixelRatio = (sourceWidth * sourceHeight) / (width * height)
  return Math.max(converted.blob.size, Math.round(converted.blob.size * pixelRatio))
}

export function createConvertedFilename(name, extension) {
  const base = String(name || 'imagem').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'imagem'
  return `${base}-convertida.${extension}`
}
