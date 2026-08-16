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

  useEffect(() => {
    currentImageRef.current = image
  }, [image])

  useEffect(() => () => revokeLoadedImage(currentImageRef.current), [])

  const resetEditor = () => {
    setOffset(INITIAL_OFFSET)
    setSettings(createInitialSettings())
    setZoom(1)
    setHostedUrl('')
  }

  const handleFileSelect = async (file) => {
    setError('')
    setFeedback('')
    setHostedUrl('')
    try {
      setBusy(true)
      const loaded = await loadImageFile(file)
      revokeLoadedImage(currentImageRef.current)
      currentImageRef.current = loaded
      setImage(loaded)
      resetEditor()
      setFeedback('Imagem pronta para ajustar.')
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
    setFeedback('Imagem copiada.')
  })

  const handleHost = () => runExport(async () => {
    const blob = await renderExport()
    const formatConfig = EXPORT_FORMATS[format]
    const filename = createFilename(image.name, formatConfig.extension)
    const file = new File([blob], filename, { type: formatConfig.mime })
    const asset = await upload(file)
    setHostedUrl(asset.publicUrl || asset.directUrl || '')
    setFeedback('Imagem hospedada. O link está pronto.')
  })

  const handleCopyLink = () => runExport(async () => {
    if (!hostedUrl) throw new Error('Hospede a imagem antes de copiar o link.')
    await copyText(hostedUrl)
    setFeedback('Link copiado.')
  })

  const handleNewImage = () => {
    revokeLoadedImage(currentImageRef.current)
    currentImageRef.current = null
    setImage(null)
    setError('')
    setFeedback('')
    resetEditor()
  }

  const hostingActions = (
    <>
      <button className="bds-round-crop-host" disabled={busy} onClick={handleHost} type="button"><UploadCloud size={16} />{hostedUrl ? 'Hospedar novamente' : 'Hospedar'}</button>
      <button className="bds-round-crop-copy-link" disabled={busy || !hostedUrl} onClick={handleCopyLink} type="button"><Clipboard size={16} />Copiar link</button>
    </>
  )

  return (
    <ImageToolLayout
      className="bds-round-crop-tool"
      icon={Scissors}
      title="Cortar Foto Redonda"
      description="Envie, ajuste e finalize sua imagem circular no mesmo lugar."
      error={error}
      feedback={feedback}
      upload={<ImageUpload compact={Boolean(image)} filename={image?.name} onFileSelect={handleFileSelect} preview={image?.src} />}
      settings={image ? (
        <CropControls
          onCenter={() => { setOffset(INITIAL_OFFSET); setFeedback('Imagem centralizada.') }}
          onSettingsChange={(nextSettings) => { setSettings(nextSettings); setHostedUrl('') }}
          onZoomChange={(nextZoom) => { setZoom(nextZoom); setHostedUrl('') }}
          settings={settings}
          zoom={zoom}
        />
      ) : null}
      preview={image ? (
        <ImagePreviewCanvas
          {...getRenderConfig(image.element, CROP_PREVIEW_SIZE, zoom, offset, settings, format, quality)}
          help="Arraste a imagem para ajustar o enquadramento."
          onError={(previewError) => setError(previewError.message)}
          onPositionChange={(nextOffset) => { setOffset(nextOffset); setHostedUrl('') }}
          onReset={() => { setOffset(INITIAL_OFFSET); setZoom(1); setHostedUrl('') }}
          onZoomChange={(nextZoom) => { setZoom(nextZoom); setHostedUrl('') }}
          surfaceBackground="checker"
        />
      ) : null}
      exportTitle="Finalizar"
      exportPanel={image ? (
        <ImageExportPanel
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
        />
      ) : null}
    />
  )
}
