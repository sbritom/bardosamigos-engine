import { Clipboard, Scissors, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  canvasToBlob,
  copyImageBlob,
  downloadBlob,
  EXPORT_FORMATS,
  EXPORT_QUALITY,
  ImageExportPanel,
  ImagePreviewCanvas,
  ImageToolLayout,
  ImageUpload,
  loadImageFile,
  renderImagePreview,
  revokeLoadedImage,
} from '../../../image-tools'
import { useStorage } from '../../../storage'
import CropControls from './CropControls'
import { CROP_PREVIEW_SIZE, getCropExportSize, INITIAL_CROP_SETTINGS } from './cropConfig'
import './cropTool.css'

const INITIAL_OFFSET = { x: 0, y: 0 }

function createInitialSettings() {
  return {
    border: { ...INITIAL_CROP_SETTINGS.border },
    shadow: { ...INITIAL_CROP_SETTINGS.shadow },
  }
}

function createFilename(name, extension) {
  const base = String(name || 'imagem').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'imagem'
  return `${base}-redonda.${extension}`
}

async function copyText(text) {
  if (globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(text)
    return
  }
  if (!globalThis.document) throw new Error('A cópia automática não está disponível neste navegador.')
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  const copied = document.execCommand?.('copy')
  document.body.removeChild(textarea)
  if (!copied) throw new Error('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.')
}

function getRenderConfig(image, outputSize, zoom, position, settings, format, quality) {
  return {
    image,
    outputWidth: outputSize,
    outputHeight: outputSize,
    zoom,
    position,
    shape: 'circle',
    fit: 'cover',
    border: settings.border,
    shadow: settings.shadow,
    background: { type: 'transparent' },
    format,
    quality,
    decorationBaseSize: 360,
  }
}

export default function CropTool() {
  const currentImageRef = useRef(null)
  const { upload } = useStorage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [format, setFormat] = useState('png')
  const [hostedUrl, setHostedUrl] = useState('')
  const [image, setImage] = useState(null)
  const [offset, setOffset] = useState(INITIAL_OFFSET)
  const [quality, setQuality] = useState('original')
  const [settings, setSettings] = useState(createInitialSettings)
  const [zoom, setZoom] = useState(1)

  useEffect(() => { currentImageRef.current = image }, [image])
  useEffect(() => () => { if (currentImageRef.current) revokeLoadedImage(currentImageRef.current) }, [])

  function resetEditor() {
    setOffset(INITIAL_OFFSET)
    setSettings(createInitialSettings())
    setZoom(1)
    setHostedUrl('')
  }

  async function handleFileSelect(file) {
    setBusy(true); setError(''); setFeedback('')
    try {
      const loaded = await loadImageFile(file)
      if (currentImageRef.current) revokeLoadedImage(currentImageRef.current)
      currentImageRef.current = loaded
      setImage(loaded)
      resetEditor()
    } catch (loadError) { setError(loadError.message) } finally { setBusy(false) }
  }

  async function createOutputBlob() {
    if (!image?.element) throw new Error('Selecione uma imagem primeiro.')
    const outputSize = getCropExportSize(image.element, quality)
    if (!Number.isFinite(outputSize) || outputSize <= 0) throw new Error('Não foi possível calcular o tamanho da imagem.')
    const canvas = document.createElement('canvas')
    renderImagePreview(canvas, getRenderConfig(image.element, outputSize, zoom, offset, settings, format, quality))
    const formatConfig = EXPORT_FORMATS[format] || EXPORT_FORMATS.png
    const qualityConfig = EXPORT_QUALITY[quality] || EXPORT_QUALITY.original
    return canvasToBlob(canvas, formatConfig.mime, qualityConfig.value)
  }

  async function handleDownload() {
    setBusy(true); setError(''); setFeedback('')
    try {
      const blob = await createOutputBlob()
      const extension = (EXPORT_FORMATS[format] || EXPORT_FORMATS.png).extension
      downloadBlob(blob, createFilename(image?.name, extension))
      setFeedback('Imagem baixada.')
    } catch (actionError) { setError(actionError.message) } finally { setBusy(false) }
  }

  async function handleCopy() {
    setBusy(true); setError(''); setFeedback('')
    try { await copyImageBlob(await createOutputBlob()); setFeedback('Imagem copiada.') }
    catch (actionError) { setError(actionError.message) } finally { setBusy(false) }
  }

  async function handleHost() {
    setBusy(true); setError(''); setFeedback('')
    try {
      const blob = await createOutputBlob()
      const extension = (EXPORT_FORMATS[format] || EXPORT_FORMATS.png).extension
      const asset = await upload(blob, { filename: createFilename(image?.name, extension) })
      const nextUrl = asset.publicUrl || asset.shareUrl || asset.url || ''
      if (!nextUrl) throw new Error('A hospedagem foi concluída, mas nenhum link público foi retornado.')
      setHostedUrl(nextUrl)
      setFeedback('Imagem hospedada. O link já está pronto para copiar.')
    } catch (actionError) { setError(actionError.message) } finally { setBusy(false) }
  }

  async function handleCopyLink() {
    if (!hostedUrl) return
    setError('')
    try { await copyText(hostedUrl); setFeedback('Link copiado.') }
    catch (actionError) { setError(actionError.message) }
  }

  function handleNewImage() {
    if (currentImageRef.current) revokeLoadedImage(currentImageRef.current)
    currentImageRef.current = null
    setImage(null); setError(''); setFeedback(''); resetEditor()
  }

  const hostingActions = <>
    <button className="bds-round-crop-host" disabled={busy} onClick={handleHost} type="button"><UploadCloud size={16} />{hostedUrl ? 'Hospedar novamente' : 'Hospedar'}</button>
    <button className="bds-round-crop-copy-link" disabled={busy || !hostedUrl} onClick={handleCopyLink} type="button"><Clipboard size={16} />Copiar link</button>
  </>

  return (
    <ImageToolLayout
      className={`bds-round-crop-tool ${image ? 'has-image' : 'is-empty'}`}
      icon={Scissors}
      title="Cortar Foto Redonda"
      description="Envie, ajuste e finalize sua imagem circular no mesmo lugar."
      hideHeader
      hideSectionHeaders
      error={error}
      feedback={feedback}
      upload={<ImageUpload compact={Boolean(image)} filename={image?.name} onFileSelect={handleFileSelect} preview={image?.src} />}
      settings={image ? <CropControls
        onCenter={() => { setOffset(INITIAL_OFFSET); setFeedback('Imagem centralizada.') }}
        onSettingsChange={(nextSettings) => { setSettings(nextSettings); setHostedUrl('') }}
        onZoomChange={(nextZoom) => { setZoom(nextZoom); setHostedUrl('') }}
        settings={settings}
        zoom={zoom}
      /> : null}
      preview={image ? <ImagePreviewCanvas
        {...getRenderConfig(image.element, CROP_PREVIEW_SIZE, zoom, offset, settings, format, quality)}
        help="Arraste a imagem para ajustar o enquadramento."
        onError={(previewError) => setError(previewError.message)}
        onPositionChange={(nextOffset) => { setOffset(nextOffset); setHostedUrl('') }}
        onReset={() => { setOffset(INITIAL_OFFSET); setZoom(1); setHostedUrl('') }}
        onZoomChange={(nextZoom) => { setZoom(nextZoom); setHostedUrl('') }}
        surfaceBackground="checker"
      /> : null}
      exportPanel={image ? <ImageExportPanel
        busy={busy}
        extraActions={hostingActions}
        format={format}
        onClear={() => { resetEditor(); setFeedback('Ajustes restaurados.') }}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onFormatChange={(nextFormat) => { setFormat(nextFormat); setHostedUrl('') }}
        onNewImage={handleNewImage}
        onQualityChange={(nextQuality) => { setQuality(nextQuality); setHostedUrl('') }}
        quality={quality}
      /> : null}
    />
  )
}
