import { Columns2, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  canvasToBlob,
  copyImageBlob,
  downloadBlob,
  EXPORT_FORMATS,
  EXPORT_QUALITY,
  getImagePreviewDimensions,
  ImageExportPanel,
  ImagePreviewCanvas,
  ImageToolLayout,
  ImageUpload,
  loadImageFile,
  renderImagePreview,
  revokeLoadedImage,
} from '../../../image-tools'
import RemoveBackgroundControls from './RemoveBackgroundControls'
import RemoveBackgroundInfo from './RemoveBackgroundInfo'
import { backgroundRemovalProvider } from './providers'
import './removeBackground.css'

const INITIAL_OFFSET = { x: 0, y: 0 }
function createFilename(name, extension) {
  const base = String(name || 'imagem').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'imagem'
  return `${base}-sem-fundo.${extension}`
}

export default function RemoveBackgroundTool() {
  const imageRef = useRef(null)
  const resultRef = useRef(null)
  const processGenerationRef = useRef(0)
  const [autoCrop, setAutoCrop] = useState(true)
  const [busy, setBusy] = useState(false)
  const [customBackground, setCustomBackground] = useState('#7A7A7A')
  const [error, setError] = useState('')
  const [exportInfo, setExportInfo] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [format, setFormat] = useState('png')
  const [image, setImage] = useState(null)
  const [offset, setOffset] = useState(INITIAL_OFFSET)
  const [previewBackground, setPreviewBackground] = useState('checker')
  const [previewMode, setPreviewMode] = useState('comparison')
  const [processing, setProcessing] = useState(false)
  const [processingQuality, setProcessingQuality] = useState('high')
  const [quality, setQuality] = useState('original')
  const [result, setResult] = useState(null)
  const [smoothing, setSmoothing] = useState(20)
  const [zoom, setZoom] = useState(1)

  const clearResult = () => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url)
    resultRef.current = null
    setResult(null)
  }

  useEffect(() => () => {
    revokeLoadedImage(imageRef.current)
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url)
  }, [])

  useEffect(() => {
    if (!image?.element) return undefined
    const generation = ++processGenerationRef.current
    const timer = window.setTimeout(async () => {
      setProcessing(true)
      setError('')
      try {
        const processed = await backgroundRemovalProvider.process(image.element, { quality: processingQuality, smoothing, autoCrop })
        const blob = await canvasToBlob(processed.canvas, 'image/png', 1)
        if (generation !== processGenerationRef.current) return
        const next = { ...processed, blob, size: blob.size, url: URL.createObjectURL(blob) }
        if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url)
        resultRef.current = next
        setResult(next)
      } catch (processError) {
        if (generation === processGenerationRef.current) setError(processError.message || 'Não foi possível remover o fundo.')
      } finally {
        if (generation === processGenerationRef.current) setProcessing(false)
      }
    }, 220)
    return () => window.clearTimeout(timer)
  }, [autoCrop, image, processingQuality, smoothing])

  const resetView = () => {
    setOffset(INITIAL_OFFSET)
    setZoom(1)
  }

  const resetSettings = () => {
    setAutoCrop(true)
    setProcessingQuality('high')
    setSmoothing(20)
    setPreviewBackground('checker')
    setCustomBackground('#7A7A7A')
    setPreviewMode('comparison')
    resetView()
    setExportInfo(null)
  }

  const handleFileSelect = async (file) => {
    processGenerationRef.current += 1
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      const loaded = await loadImageFile(file)
      revokeLoadedImage(imageRef.current)
      imageRef.current = loaded
      setImage(loaded)
      setProcessing(false)
      clearResult()
      resetSettings()
      setFeedback('Imagem carregada. Removendo o fundo automaticamente.')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setBusy(false)
    }
  }

  const processForExport = async (targetFormat) => {
    if (!image?.element) throw new Error('Selecione uma imagem antes de exportar.')
    const processed = await backgroundRemovalProvider.process(image.element, {
      quality: processingQuality,
      smoothing,
      autoCrop,
    })
    const canvas = document.createElement('canvas')
    renderImagePreview(canvas, {
      image: processed.canvas,
      outputWidth: processed.width,
      outputHeight: processed.height,
      fit: 'stretch',
      shape: 'square',
      background: { type: 'transparent' },
      edgeInset: 0,
      format: targetFormat,
      quality,
    })
    const config = EXPORT_FORMATS[targetFormat]
    const blob = await canvasToBlob(canvas, config.mime, EXPORT_QUALITY[quality].value)
    return { blob, width: canvas.width, height: canvas.height }
  }

  const runExport = async (action) => {
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      await action()
    } catch (exportError) {
      setError(exportError.message || 'Não foi possível exportar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = () => runExport(async () => {
    const exported = await processForExport(format)
    const config = EXPORT_FORMATS[format]
    downloadBlob(exported.blob, createFilename(image.name, config.extension))
    setExportInfo({ format: config.extension.toUpperCase(), size: exported.blob.size, width: exported.width, height: exported.height })
    setFeedback('Download iniciado.')
  })

  const handleCopy = () => runExport(async () => {
    const exported = await processForExport('png')
    await copyImageBlob(exported.blob)
    setExportInfo({ format: 'PNG', size: exported.blob.size, width: exported.width, height: exported.height })
    setFeedback('Imagem copiada para a área de transferência.')
  })

  const handleNewImage = () => {
    processGenerationRef.current += 1
    revokeLoadedImage(imageRef.current)
    imageRef.current = null
    setImage(null)
    clearResult()
    resetSettings()
    setError('')
    setFeedback('')
  }

  const previewItems = useMemo(() => image ? [
    { id: 'original', label: 'Imagem original', image: image.element, ...getImagePreviewDimensions(image.element) },
    ...(result?.canvas ? [{ id: 'result', label: 'Imagem sem fundo', image: result.canvas, ...getImagePreviewDimensions(result.canvas) }] : []),
  ].map((item) => ({ ...item, outputWidth: item.width, outputHeight: item.height })) : [], [image, result])

  return (
    <ImageToolLayout
      icon={WandSparkles}
      title="Remover Fundo"
      description="Remova fundos uniformes diretamente no navegador, sem enviar sua imagem para servidores externos."
      error={error}
      feedback={feedback}
      upload={<ImageUpload compact={Boolean(image)} filename={image?.name} onFileSelect={handleFileSelect} preview={image?.src} />}
      settings={image ? (
        <>
          <RemoveBackgroundControls
            autoCrop={autoCrop}
            customBackground={customBackground}
            onAutoCropChange={setAutoCrop}
            onCustomBackgroundChange={setCustomBackground}
            onCenter={() => setOffset(INITIAL_OFFSET)}
            onPreviewBackgroundChange={setPreviewBackground}
            onProcessingQualityChange={setProcessingQuality}
            onResetZoom={() => setZoom(1)}
            onSmoothingChange={setSmoothing}
            onZoomChange={setZoom}
            previewBackground={previewBackground}
            processingQuality={processingQuality}
            smoothing={smoothing}
            zoom={zoom}
          />
          <RemoveBackgroundInfo exportInfo={exportInfo} image={image} result={result} />
        </>
      ) : null}
      preview={image ? (
        <div className="bds-remove-bg-preview">
          <div className="bds-remove-bg-preview__modes" role="group" aria-label="Modo de visualização">
            {[
              ['original', 'Original'],
              ['result', 'Resultado'],
              ['comparison', 'Comparação'],
            ].map(([value, label]) => <button aria-pressed={previewMode === value} className={previewMode === value ? 'is-selected' : ''} disabled={!result && value !== 'original'} key={value} onClick={() => setPreviewMode(value)} type="button">{label}</button>)}
          </div>
          {processing && <p className="bds-remove-bg-processing" role="status">Processando imagem...</p>}
          <ImagePreviewCanvas
            background={{ type: 'transparent' }}
            customBackground={customBackground}
            edgeInset={0}
            fit="stretch"
            interactionMode="view"
            items={previewItems}
            onError={(previewError) => setError(previewError.message)}
            onPositionChange={setOffset}
            onReset={resetView}
            onZoomChange={setZoom}
            position={offset}
            previewMode={previewMode}
            quality={processingQuality}
            shape="square"
            surfaceBackground={previewBackground}
            zoom={zoom}
          />
        </div>
      ) : null}
      exportPanel={image ? (
        <ImageExportPanel
          busy={busy || processing}
          extraActions={<button disabled={!result} onClick={() => setPreviewMode('comparison')} type="button"><Columns2 size={16} />Comparar original</button>}
          format={format}
          onClear={() => { resetSettings(); setFeedback('Ajustes restaurados.') }}
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
