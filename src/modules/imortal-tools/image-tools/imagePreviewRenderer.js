import { clamp, hexToRgb } from './imageToolUtils'

export const IMAGE_PREVIEW_BASE_SIZE = 720

function colorWithOpacity(hex, opacity) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${clamp(opacity, 0, 100) / 100})`
}

function createShapePath(context, shape, x, y, width, height) {
  context.beginPath()
  if (shape === 'circle') {
    context.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
  } else if (shape === 'squircle') {
    context.roundRect(x, y, width, height, Math.min(width, height) * 0.22)
  } else if (shape === 'hexagon') {
    const points = [
      [x + width * 0.25, y], [x + width * 0.75, y], [x + width, y + height * 0.5],
      [x + width * 0.75, y + height], [x + width * 0.25, y + height], [x, y + height * 0.5],
    ]
    points.forEach(([pointX, pointY], index) => index ? context.lineTo(pointX, pointY) : context.moveTo(pointX, pointY))
    context.closePath()
  } else {
    context.rect(x, y, width, height)
  }
}

function createPaint(context, width, height, config = {}) {
  if (config.type === 'linear') {
    const angle = (Number(config.angle) - 90) * Math.PI / 180
    const centerX = width / 2
    const centerY = height / 2
    const distance = Math.max(width, height) / 2
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance
    const gradient = context.createLinearGradient(centerX - x, centerY - y, centerX + x, centerY + y)
    gradient.addColorStop(0, config.color1 || '#FFFFFF')
    gradient.addColorStop(1, config.color2 || '#000000')
    return gradient
  }
  if (config.type === 'radial') {
    const gradient = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2)
    gradient.addColorStop(0, config.color1 || '#FFFFFF')
    gradient.addColorStop(1, config.color2 || '#000000')
    return gradient
  }
  return config.color1 || '#FFFFFF'
}

function drawFittedImage(context, source, bounds, fit, zoom, position) {
  if (!source) return
  const sourceWidth = source.naturalWidth || source.videoWidth || source.width
  const sourceHeight = source.naturalHeight || source.videoHeight || source.height
  if (!sourceWidth || !sourceHeight) return
  const { x, y, width, height } = bounds
  if (fit === 'stretch') {
    context.drawImage(source, x, y, width, height)
    return
  }
  const baseScale = fit === 'contain'
    ? Math.min(width / sourceWidth, height / sourceHeight)
    : Math.max(width / sourceWidth, height / sourceHeight)
  const scale = baseScale * zoom
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  context.drawImage(
    source,
    x + (width - drawWidth) / 2 + position.x * width,
    y + (height - drawHeight) / 2 + position.y * height,
    drawWidth,
    drawHeight,
  )
}

function applyLineStyle(context, border, scale) {
  context.lineCap = 'round'
  if (border.style === 'dashed') context.setLineDash([10 * scale, 7 * scale])
  if (border.style === 'dotted') context.setLineDash([1 * scale, 7 * scale])
}

function drawFrame(context, shape, frame, color, bounds, scale) {
  if (!frame || frame === 'none') return
  context.save()
  context.strokeStyle = color
  context.lineWidth = 3 * scale
  const stroke = (inset) => {
    createShapePath(context, shape, bounds.x + inset, bounds.y + inset, bounds.width - inset * 2, bounds.height - inset * 2)
    context.stroke()
  }
  if (frame === 'plain') stroke(4 * scale)
  if (frame === 'double') { stroke(3 * scale); stroke(9 * scale) }
  if (frame === 'inner') stroke(10 * scale)
  if (frame === 'outer') stroke(-3 * scale)
  context.restore()
}

export function renderImagePreview(canvas, {
  image,
  outputWidth = IMAGE_PREVIEW_BASE_SIZE,
  outputHeight = outputWidth,
  zoom = 1,
  position = { x: 0, y: 0 },
  shape = 'square',
  fit = 'cover',
  border = null,
  shadow = null,
  background = { type: 'transparent' },
  frame = 'none',
  format = 'png',
  quality = 'high',
  decorationBaseSize = IMAGE_PREVIEW_BASE_SIZE,
  edgeInset,
} = {}) {
  const context = canvas.getContext('2d')
  if (!context || !image) return canvas
  const width = Math.max(1, Math.round(outputWidth))
  const height = Math.max(1, Math.round(outputHeight))
  const referenceSize = Math.min(width, height)
  const scale = referenceSize / decorationBaseSize
  const borderWidth = border?.enabled ? border.width * scale : 0
  const shadowExtent = shadow?.enabled ? (shadow.blur + Math.max(Math.abs(shadow.offsetX), Math.abs(shadow.offsetY))) * scale : 0
  const frameExtent = frame && frame !== 'none' ? 10 * scale : 0
  const automaticInset = Math.min(referenceSize * 0.2, Math.max(scale, shadowExtent * 1.35, frameExtent, borderWidth / 2 + scale))
  const inset = edgeInset == null ? automaticInset : Math.max(0, edgeInset * scale)
  const bounds = { x: inset, y: inset, width: width - inset * 2, height: height - inset * 2 }

  canvas.width = width
  canvas.height = height
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = quality === 'low' ? 'low' : quality === 'medium' ? 'medium' : 'high'
  if (format === 'jpg') {
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, width, height)
  }

  if (shadow?.enabled) {
    context.save()
    context.shadowColor = colorWithOpacity(shadow.color, shadow.opacity)
    context.shadowBlur = shadow.blur * scale
    context.shadowOffsetX = shadow.offsetX * scale
    context.shadowOffsetY = shadow.offsetY * scale
    context.fillStyle = shadow.color
    createShapePath(context, shape, bounds.x, bounds.y, bounds.width, bounds.height)
    context.fill()
    context.restore()
  }

  context.save()
  createShapePath(context, shape, bounds.x, bounds.y, bounds.width, bounds.height)
  context.clip()
  if (background.type !== 'transparent' || format === 'jpg') {
    context.fillStyle = background.type === 'transparent' ? '#FFFFFF' : createPaint(context, width, height, background)
    context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
  if (background.type === 'image' && background.image?.element) {
    drawFittedImage(context, background.image.element, bounds, 'cover', 1, { x: 0, y: 0 })
  }
  drawFittedImage(context, image, bounds, fit, zoom, position)
  context.restore()

  if (border?.enabled && borderWidth > 0) {
    context.save()
    context.globalAlpha = clamp(border.opacity, 0, 100) / 100
    context.strokeStyle = createPaint(context, width, height, border)
    context.lineWidth = borderWidth
    applyLineStyle(context, border, scale)
    createShapePath(context, shape, bounds.x, bounds.y, bounds.width, bounds.height)
    context.stroke()
    context.restore()
  }

  drawFrame(context, shape, frame, border?.color1 || '#FFFFFF', bounds, scale)
  return canvas
}

export function getImagePreviewDimensions(source, maxDimension = 900) {
  const width = source?.naturalWidth || source?.videoWidth || source?.width || maxDimension
  const height = source?.naturalHeight || source?.videoHeight || source?.height || maxDimension
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}
