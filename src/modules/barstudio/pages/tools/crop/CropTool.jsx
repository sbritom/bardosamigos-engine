import { Scissors } from 'lucide-react'
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [format, setFormat] = useState('png')
  const [image, setImage] = useState(null)
  const [offset, setOffset] = useState(INITIAL_OFFSET)
  const [quality, setQuality] = useState('original')
  const [settings, setSettings] = useState(createInitialSettings)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    currentImageRef.current = image
  }, [image])

  useEffect(() => () => revokeLoadedImage(currentImageRef.current), [])

  const resetEditor = () => {
    setOffset(INITIAL_OFFSET)
    setSettings(createInitialSettings())
    setZoom(1)
  }

  const handleFileSelect = async (file) => {
    setError('')
    setFeedback('')
    try {
      setBusy(true)
      const loaded = await loadImageFile(file)
      revokeLoadedImage(currentImageRef.current)
      currentImageRef.current = loaded
      setImage(loaded)
      resetEditor()
      setFeedback('Imagem carregada. O preview já está pronto para ajustar.')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setBusy(false)
    }
  }

  const renderExport = async (targetFormat = format) => {
    if (!image?.element) throw new Error('Selecione uma imagem antes de exportar.')
    const canvas = document.createElement('canvas')
    renderImagePreview(canvas, getRenderConfig(image.element, getCropExportSize(image.element, quality), zoom, offset, settings, targetFormat, quality))
    const formatConfig = EXPORT_FORMATS[targetFormat]
    return canvasToBlob(canvas, formatConfig.mime, EXPORT_QUALITY[quality].value)
  }

  const runExport = async (action) => {
    setError('')
    setFeedback('')
    try {
      setBusy(true)
      await action()
    } catch (exportError) {
      setError(exportError.message || 'Não foi possível exportar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = () => runExport(async () => {
    const blob = await renderExport()
    const formatConfig = EXPORT_FORMATS[format]
    downloadBlob(blob, createFilename(image.name, formatConfig.extension))
    setFeedback('Download iniciado.')
  })

  const handleCopy = () => runExport(async () => {
    const blob = await renderExport('png')
    await copyImageBlob(blob)
    setFeedback('Imagem copiada para a área de transferência.')
  })

  const handleNewImage = () => {
    revokeLoadedImage(currentImageRef.current)
    currentImageRef.current = null
    setImage(null)
    setError('')
    setFeedback('')
    resetEditor()
  }

  return (
    <ImageToolLayout
      icon={Scissors}
      title="Cortar Foto Redonda"
      description="Crie uma imagem circular com fundo transparente e exporte no formato desejado."
      error={error}
      feedback={feedback}
      upload={<ImageUpload compact={Boolean(image)} filename={image?.name} onFileSelect={handleFileSelect} preview={image?.src} />}
      settings={image ? (
        <CropControls
          onCenter={() => { setOffset(INITIAL_OFFSET); setFeedback('Imagem centralizada.') }}
          onSettingsChange={setSettings}
          onZoomChange={setZoom}
          settings={settings}
          zoom={zoom}
        />
      ) : null}
      preview={image ? (
        <ImagePreviewCanvas
          {...getRenderConfig(image.element, CROP_PREVIEW_SIZE, zoom, offset, settings, format, quality)}
          help="Arraste a imagem ou use as setas do teclado para ajustar o enquadramento."
          onError={(previewError) => setError(previewError.message)}
          onPositionChange={setOffset}
          onReset={() => { setOffset(INITIAL_OFFSET); setZoom(1) }}
          onZoomChange={setZoom}
          surfaceBackground="checker"
        />
      ) : null}
      exportPanel={image ? (
        <ImageExportPanel
          busy={busy}
          format={format}
          onClear={() => { resetEditor(); setFeedback('Ajustes restaurados.') }}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onFormatChange={setFormat}
          onNewImage={handleNewImage}
          onQualityChange={setQuality}
          quality={quality}
        />
      ) : null}
    />
  )
}
