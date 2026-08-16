import { Copy, Pipette, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageToolLayout, ImageUpload, loadImageFile, revokeLoadedImage } from '../../../image-tools'
import './extractColors.css'

const COUNTS = [5, 8, 12]
const INITIAL_COUNT = 8

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function colorDistance(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function luminance({ r, g, b }) {
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b)
}

function extractPalette(image, count, ignoreTransparent) {
  const naturalWidth = image.naturalWidth || image.width
  const naturalHeight = image.naturalHeight || image.height
  const maxSide = 180
  const scale = Math.min(1, maxSide / Math.max(naturalWidth, naturalHeight))
  const width = Math.max(1, Math.round(naturalWidth * scale))
  const height = Math.max(1, Math.round(naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  const buckets = new Map()
  let sampledPixels = 0

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3]
    if (ignoreTransparent && alpha < 80) continue
    if (alpha < 12) continue

    const r = pixels[index]
    const g = pixels[index + 1]
    const b = pixels[index + 2]
    const qr = Math.round(r / 24) * 24
    const qg = Math.round(g / 24) * 24
    const qb = Math.round(b / 24) * 24
    const key = `${qr}-${qg}-${qb}`
    const current = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 }
    current.count += 1
    current.r += r
    current.g += g
    current.b += b
    buckets.set(key, current)
    sampledPixels += 1
  }

  const candidates = [...buckets.values()]
    .map((bucket) => ({
      count: bucket.count,
      r: bucket.r / bucket.count,
      g: bucket.g / bucket.count,
      b: bucket.b / bucket.count,
    }))
    .sort((a, b) => b.count - a.count)

  const selected = []
  for (const candidate of candidates) {
    if (selected.every((color) => colorDistance(color, candidate) >= 46)) selected.push(candidate)
    if (selected.length >= count) break
  }

  if (selected.length < count) {
    for (const candidate of candidates) {
      if (!selected.includes(candidate) && selected.every((color) => colorDistance(color, candidate) >= 26)) selected.push(candidate)
      if (selected.length >= count) break
    }
  }

  return selected.slice(0, count).map((color) => ({
    ...color,
    hex: rgbToHex(color.r, color.g, color.b),
    rgb: `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`,
    percentage: sampledPixels ? (color.count / sampledPixels) * 100 : 0,
  }))
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const input = document.createElement('textarea')
  input.value = value
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

export default function ExtractColorsTool() {
  const imageRef = useRef(null)
  const [image, setImage] = useState(null)
  const [colorCount, setColorCount] = useState(INITIAL_COUNT)
  const [ignoreTransparent, setIgnoreTransparent] = useState(true)
  const [sortMode, setSortMode] = useState('dominance')
  const [palette, setPalette] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => () => revokeLoadedImage(imageRef.current), [])

  useEffect(() => {
    if (!image?.element) return
    try {
      setPalette(extractPalette(image.element, colorCount, ignoreTransparent))
    } catch {
      setError('Não foi possível analisar as cores desta imagem.')
    }
  }, [image, colorCount, ignoreTransparent])

  const sortedPalette = useMemo(() => {
    const colors = [...palette]
    if (sortMode === 'light') return colors.sort((a, b) => luminance(b) - luminance(a))
    if (sortMode === 'dark') return colors.sort((a, b) => luminance(a) - luminance(b))
    return colors.sort((a, b) => b.count - a.count)
  }, [palette, sortMode])

  const handleFileSelect = async (file) => {
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      const loaded = await loadImageFile(file)
      revokeLoadedImage(imageRef.current)
      imageRef.current = loaded
      setImage(loaded)
      setFeedback('Imagem analisada. A paleta foi extraída automaticamente.')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async (value) => {
    try {
      await copyText(value)
      setFeedback(`${value} copiado.`)
    } catch {
      setError('Não foi possível copiar a cor.')
    }
  }

  const handleCopyPalette = async () => {
    const value = sortedPalette.map((color) => color.hex).join(', ')
    await handleCopy(value)
  }

  const handleNewImage = () => {
    revokeLoadedImage(imageRef.current)
    imageRef.current = null
    setImage(null)
    setPalette([])
    setError('')
    setFeedback('')
    setColorCount(INITIAL_COUNT)
    setIgnoreTransparent(true)
    setSortMode('dominance')
  }

  return (
    <ImageToolLayout
      className={`bds-extract-colors ${image ? 'has-image' : 'is-empty'}`}
      icon={Pipette}
      title="Extrair Cores"
      description="Descubra as cores predominantes de qualquer imagem diretamente no navegador."
      hideHeader
      hideSectionHeaders
      error={error}
      feedback={feedback}
      upload={<ImageUpload compact={Boolean(image)} filename={image?.name} onFileSelect={handleFileSelect} preview={image?.src} />}
      settings={image ? (
        <div className="bds-extract-controls">
          <div className="bds-extract-group">
            <strong>Quantidade de cores</strong>
            <div className="bds-extract-segments">
              {COUNTS.map((count) => <button className={colorCount === count ? 'is-selected' : ''} key={count} onClick={() => setColorCount(count)} type="button">{count}</button>)}
            </div>
          </div>
          <div className="bds-extract-group">
            <strong>Ordenação</strong>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="dominance">Predominância</option>
              <option value="light">Mais claras primeiro</option>
              <option value="dark">Mais escuras primeiro</option>
            </select>
          </div>
          <label className="bds-extract-toggle">
            <input checked={ignoreTransparent} onChange={(event) => setIgnoreTransparent(event.target.checked)} type="checkbox" />
            <span>Ignorar pixels transparentes</span>
          </label>
          <div className="bds-extract-summary">
            <span>{image.element.naturalWidth || image.element.width} × {image.element.naturalHeight || image.element.height}px</span>
            <span>{sortedPalette.length} cores detectadas</span>
          </div>
        </div>
      ) : null}
      preview={image ? (
        <div className="bds-extract-preview">
          <div className="bds-extract-image-frame"><img src={image.src} alt="Imagem usada para extrair a paleta" /></div>
          <div className="bds-extract-palette" aria-label="Paleta extraída">
            {sortedPalette.map((color) => (
              <button className="bds-extract-color" key={color.hex} onClick={() => handleCopy(color.hex)} type="button" title={`Copiar ${color.hex}`}>
                <span className="bds-extract-swatch" style={{ background: color.hex }} />
                <span className="bds-extract-color-copy">
                  <strong>{color.hex}</strong>
                  <small>{color.rgb}</small>
                </span>
                <span className="bds-extract-share">{color.percentage.toFixed(1)}%</span>
                <Copy size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      exportTitle="Paleta"
      exportPanel={image ? (
        <div className="bds-extract-actions">
          <button disabled={busy || !sortedPalette.length} onClick={handleCopyPalette} type="button"><Copy size={16} />Copiar paleta</button>
          <button onClick={() => setPalette(extractPalette(image.element, colorCount, ignoreTransparent))} type="button"><RefreshCw size={16} />Analisar novamente</button>
          <button onClick={handleNewImage} type="button">Nova imagem</button>
        </div>
      ) : null}
    />
  )
}
