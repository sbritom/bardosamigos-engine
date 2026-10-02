import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision'
import { BackgroundRemovalProvider } from './BackgroundRemovalProvider'

const QUALITY_LIMITS = {
  standard: 960,
  high: 1600,
  maximum: Number.POSITIVE_INFINITY,
}

const MEDIAPIPE_VERSION = '0.10.35'
const WASM_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const SELFIE_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'
let segmenterPromise = null

function getScaledSize(image, quality) {
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  const limit = QUALITY_LIMITS[quality] || QUALITY_LIMITS.high
  const scale = Number.isFinite(limit) ? Math.min(1, limit / Math.max(width, height)) : 1
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

async function getPersonSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: SELFIE_MODEL,
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        outputCategoryMask: true,
        outputConfidenceMasks: true,
      })
    })().catch((error) => {
      segmenterPromise = null
      throw error
    })
  }
  return segmenterPromise
}

function sampleCorner(data, width, height, startX, startY, sampleSize) {
  let red = 0
  let green = 0
  let blue = 0
  let count = 0
  for (let y = startY; y < Math.min(height, startY + sampleSize); y += 1) {
    for (let x = startX; x < Math.min(width, startX + sampleSize); x += 1) {
      const index = (y * width + x) * 4
      if (data[index + 3] === 0) continue
      red += data[index]
      green += data[index + 1]
      blue += data[index + 2]
      count += 1
    }
  }
  return count ? [red / count, green / count, blue / count] : [255, 255, 255]
}

function getBackgroundSamples(data, width, height) {
  const size = Math.max(2, Math.round(Math.min(width, height) * 0.025))
  return [
    sampleCorner(data, width, height, 0, 0, size),
    sampleCorner(data, width, height, Math.max(0, width - size), 0, size),
    sampleCorner(data, width, height, 0, Math.max(0, height - size), size),
    sampleCorner(data, width, height, Math.max(0, width - size), Math.max(0, height - size), size),
  ]
}

function colorDistance(data, index, samples) {
  let minimum = Number.POSITIVE_INFINITY
  for (const [red, green, blue] of samples) {
    const redDelta = data[index] - red
    const greenDelta = data[index + 1] - green
    const blueDelta = data[index + 2] - blue
    minimum = Math.min(minimum, Math.sqrt(redDelta ** 2 + greenDelta ** 2 + blueDelta ** 2))
  }
  return minimum
}

function removeConnectedBackground(imageData, smoothing) {
  const { data, width, height } = imageData
  const samples = getBackgroundSamples(data, width, height)
  const tolerance = 52
  const feather = Math.max(0, Number(smoothing) || 0) * 0.75
  const reach = tolerance + feather
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let head = 0
  let tail = 0

  const enqueue = (pixel) => {
    if (pixel < 0 || pixel >= visited.length || visited[pixel]) return
    visited[pixel] = 1
    queue[tail] = pixel
    tail += 1
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (head < tail) {
    const pixel = queue[head]
    head += 1
    const index = pixel * 4
    const distance = colorDistance(data, index, samples)
    if (distance > reach) continue

    const edgeAlpha = feather > 0 ? Math.round(255 * Math.max(0, distance - tolerance) / feather) : 0
    data[index + 3] = Math.min(data[index + 3], edgeAlpha)
    const x = pixel % width
    const y = Math.floor(pixel / width)
    if (x > 0) enqueue(pixel - 1)
    if (x < width - 1) enqueue(pixel + 1)
    if (y > 0) enqueue(pixel - width)
    if (y < height - 1) enqueue(pixel + width)
  }
}

function applyPersonMask(canvas, segmentation, smoothing) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const confidenceMask = segmentation.confidenceMasks?.[1]
  const confidence = confidenceMask?.getAsFloat32Array?.()
  const categories = segmentation.categoryMask?.getAsUint8Array?.()
  const pixelCount = canvas.width * canvas.height

  if ((!confidence || confidence.length !== pixelCount) && (!categories || categories.length !== pixelCount)) return false

  let foregroundPixels = 0
  const softness = Math.max(0.035, Math.min(0.22, (Number(smoothing) || 0) / 180))
  const lower = 0.5 - softness
  const upper = 0.5 + softness

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const score = confidence ? confidence[pixel] : (categories[pixel] === 1 ? 1 : 0)
    if (score >= 0.5) foregroundPixels += 1
    const normalized = score <= lower ? 0 : score >= upper ? 1 : (score - lower) / (upper - lower)
    const smooth = normalized * normalized * (3 - 2 * normalized)
    const alphaIndex = pixel * 4 + 3
    imageData.data[alphaIndex] = Math.round(imageData.data[alphaIndex] * smooth)
  }

  const foregroundRatio = foregroundPixels / pixelCount
  if (foregroundRatio < 0.008 || foregroundRatio > 0.96) return false

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.putImageData(imageData, 0, 0)
  return true
}

function cropTransparentBounds(source) {
  const context = source.getContext('2d')
  const { width, height } = source
  const data = context.getImageData(0, 0, width, height).data
  let left = width
  let right = -1
  let top = height
  let bottom = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }

  if (right < left || bottom < top) return source
  const padding = Math.max(2, Math.round(Math.max(width, height) * 0.01))
  left = Math.max(0, left - padding)
  top = Math.max(0, top - padding)
  right = Math.min(width - 1, right + padding)
  bottom = Math.min(height - 1, bottom + padding)
  const target = document.createElement('canvas')
  target.width = right - left + 1
  target.height = bottom - top + 1
  target.getContext('2d').drawImage(source, left, top, target.width, target.height, 0, 0, target.width, target.height)
  return target
}

export class LocalBackgroundRemovalProvider extends BackgroundRemovalProvider {
  constructor() {
    super({ id: 'local-ai-segmentation', name: 'Segmentação local por IA' })
  }

  async process(image, { quality = 'high', smoothing = 20, autoCrop = true } = {}) {
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    const size = getScaledSize(image, quality)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, size.width, size.height)

    let usedAi = false
    try {
      const segmenter = await getPersonSegmenter()
      const segmentation = segmenter.segment(canvas)
      usedAi = applyPersonMask(canvas, segmentation, smoothing)
      segmentation.categoryMask?.close?.()
      segmentation.confidenceMasks?.forEach?.((mask) => mask?.close?.())
    } catch (error) {
      console.warn('[BarStudio] Segmentação por IA indisponível; usando removedor por cor.', error)
    }

    if (!usedAi) {
      const imageData = context.getImageData(0, 0, size.width, size.height)
      removeConnectedBackground(imageData, smoothing)
      context.clearRect(0, 0, size.width, size.height)
      context.putImageData(imageData, 0, 0)
    }

    const result = autoCrop ? cropTransparentBounds(canvas) : canvas
    return { canvas: result, width: result.width, height: result.height, providerId: this.id, usedAi }
  }
}
