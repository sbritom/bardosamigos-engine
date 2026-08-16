import { UserCircle } from 'lucide-react'
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
import AvatarControls from './AvatarControls'
import AvatarInfo from './AvatarInfo'
import { AVATAR_PRESETS, AVATAR_PREVIEW_SIZE, getAvatarOutputSize, INITIAL_AVATAR_SETTINGS } from './avatarConfig'
import './avatarTool.css'

const INITIAL_OFFSET = { x: 0, y: 0 }

function createInitialSettings() {
  return {
    ...INITIAL_AVATAR_SETTINGS,
    background: { ...INITIAL_AVATAR_SETTINGS.background },
    border: { ...INITIAL_AVATAR_SETTINGS.border },
    shadow: { ...INITIAL_AVATAR_SETTINGS.shadow },
  }
}

function createFilename(name, extension) {
  const base = String(name || 'avatar').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'avatar'
  return `${base}-avatar.${extension}`
}

function getRenderConfig(image, outputSize, zoom, position, settings, format, quality) {
  return {
    image, outputWidth: outputSize, outputHeight: outputSize, zoom, position,
    shape: settings.shape, fit: 'cover', border: settings.border, shadow: settings.shadow,
    background: settings.background, frame: settings.frame, format, quality,
    decorationBaseSize: AVATAR_PREVIEW_SIZE,
  }
}

export default function AvatarTool() {
  const currentImageRef = useRef(null)
  const backgroundImageRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [exportInfo, setExportInfo] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [format, setFormat] = useState('png')
  const [image, setImage] = useState(null)
  const [offset, setOffset] = useState(INITIAL_OFFSET)
  const [quality, setQuality] = useState('high')
  const [settings, setSettings] = useState(createInitialSettings)
  const [zoom, setZoom] = useState(1)

  useEffect(() => { currentImageRef.current = image }, [image])
  useEffect(() => () => { revokeLoadedImage(currentImageRef.current); revokeLoadedImage(backgroundImageRef.current) }, [])

  const resetPosition = () => { setOffset(INITIAL_OFFSET); setZoom(1) }
  const resetEditor = () => {
    revokeLoadedImage(backgroundImageRef.current); backgroundImageRef.current = null
    setSettings(createInitialSettings()); setQuality('high'); setFormat('png'); setExportInfo(null); resetPosition()
  }

  const handleFileSelect = async (file) => {
    setError(''); setFeedback('')
    try {
      setBusy(true)
      const loaded = await loadImageFile(file)
      revokeLoadedImage(currentImageRef.current); currentImageRef.current = loaded; setImage(loaded); resetEditor()
      setFeedback('Imagem carregada. Ajuste o avatar no preview.')
    } catch (loadError) { setError(loadError.message) } finally { setBusy(false) }
  }

  const handleBackgroundFileSelect = async (file) => {
    if (!file) return
    setError('')
    try {
      const loaded = await loadImageFile(file)
      revokeLoadedImage(backgroundImageRef.current); backgroundImageRef.current = loaded
      setSettings((current) => ({ ...current, background: { ...current.background, image: loaded } }))
      setFeedback('Imagem de fundo carregada.')
    } catch (loadError) { setError(loadError.message) }
  }

  const renderExport = async (targetFormat = format) => {
    if (!image?.element) throw new Error('Selecione uma imagem antes de exportar.')
    const outputSize = getAvatarOutputSize(settings)
    const canvas = document.createElement('canvas')
    await renderImagePreview(canvas, getRenderConfig(image.element, outputSize, zoom, offset, settings, targetFormat, quality))
    const formatConfig = EXPORT_FORMATS[targetFormat]
    const blob = await canvasToBlob(canvas, formatConfig.mime, EXPORT_QUALITY[quality].value)
    return { blob, outputSize, formatConfig }
  }

  const runExport = async (action) => {
    setError(''); setFeedback('')
    try { setBusy(true); await action() }
    catch (exportError) { setError(exportError.message || 'Não foi possível exportar o avatar.') }
    finally { setBusy(false) }
  }

  const handleDownload = () => runExport(async () => {
    const { blob, outputSize, formatConfig } = await renderExport()
    downloadBlob(blob, createFilename(image.name, formatConfig.extension))
    setExportInfo({ format: format.toUpperCase(), width: outputSize, height: outputSize, size: blob.size })
    setFeedback('Download iniciado.')
  })

  const handleCopy = () => runExport(async () => {
    const { blob, outputSize } = await renderExport('png')
    await copyImageBlob(blob)
    setExportInfo({ format: 'PNG', width: outputSize, height: outputSize, size: blob.size })
    setFeedback('Avatar copiado para a área de transferência.')
  })

  const handleNewImage = () => {
    revokeLoadedImage(currentImageRef.current); currentImageRef.current = null; setImage(null); setError(''); setFeedback(''); resetEditor()
  }

  const handlePreset = (presetId) => {
    const preset = AVATAR_PRESETS[presetId]
    if (!preset) return
    setSettings((current) => ({ ...current, shape: preset.shape, size: preset.size }))
    setQuality(preset.quality); resetPosition(); setFeedback(`Preset ${preset.label} aplicado.`)
  }

  const outputSize = getAvatarOutputSize(settings)

  return (
    <ImageToolLayout
      className={`bds-avatar-tool ${image ? 'has-image' : 'is-empty'}`}
      icon={UserCircle}
      title="Avatar Studio"
      description="Prepare avatares para suas plataformas com enquadramento, formato e acabamento personalizados."
      hideHeader
      hideSectionHeaders
      error={error}
      feedback={feedback}
      upload={<ImageUpload compact={Boolean(image)} filename={image?.name} onFileSelect={handleFileSelect} preview={image?.src} />}
      settings={image ? <AvatarControls settings={settings} onSettingsChange={setSettings} zoom={zoom} onZoomChange={setZoom} onCenter={() => { setOffset(INITIAL_OFFSET); setFeedback('Imagem centralizada.') }} onReset={() => { resetPosition(); setFeedback('Posição e zoom restaurados.') }} onPreset={handlePreset} onBackgroundFileSelect={handleBackgroundFileSelect} /> : null}
      preview={image ? <div className="bds-avatar-preview"><ImagePreviewCanvas {...getRenderConfig(image.element, AVATAR_PREVIEW_SIZE, zoom, offset, settings, format, quality)} help="Arraste a imagem para ajustar o enquadramento." onError={(previewError) => setError(previewError.message)} onPositionChange={setOffset} onReset={resetPosition} onZoomChange={setZoom} surfaceBackground="checker" /><AvatarInfo image={image} outputSize={outputSize} format={format} exportInfo={exportInfo} /></div> : null}
      exportPanel={image ? <ImageExportPanel busy={busy} format={format} onClear={() => { resetEditor(); setFeedback('Ajustes restaurados.') }} onCopy={handleCopy} onDownload={handleDownload} onFormatChange={setFormat} onNewImage={handleNewImage} onQualityChange={setQuality} quality={quality} /> : null}
    />
  )
}
