import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  copyImageBlob,
  downloadBlob,
  EXPORT_FORMATS,
  getImagePreviewDimensions,
  ImageExportPanel,
  ImagePreviewCanvas,
  ImageToolLayout,
  ImageUpload,
  loadImageFile,
  revokeLoadedImage,
} from '../../../image-tools'
import ConvertImageControls from './ConvertImageControls'
import ConvertImageInfo from './ConvertImageInfo'
import {
  CONVERTER_FORMAT_MESSAGE,
  CONVERTER_IMAGE_ACCEPT,
  CONVERTER_IMAGE_TYPES,
  convertImage,
  createConvertedFilename,
  estimateConvertedSize,
  isCanvasFormatSupported,
} from './imageConversionService'
import './convertImage.css'

const INITIAL_POSITION = { x: 0, y: 0 }
const BACKGROUND_COLORS = { white: '#FFFFFF', black: '#000000', gray: '#777777' }

export default function ConvertImageTool() {
  const imageRef = useRef(null)
  const estimateGenerationRef = useRef(0)
  const [avifSupported, setAvifSupported] = useState(false)
  const [backgroundMode, setBackgroundMode] = useState('white')
  const [busy, setBusy] = useState(false)
  const [customBackground, setCustomBackground] = useState('#056CF2')
  const [error, setError] = useState('')
  const [estimatedSize, setEstimatedSize] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [exportInfo, setExportInfo] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [format, setFormat] = useState('png')
  const [image, setImage] = useState(null)
  const [position, setPosition] = useState(INITIAL_POSITION)
  const [quality, setQuality] = useState('original')
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    isCanvasFormatSupported('avif').then(setAvifSupported).catch(() => setAvifSupported(false))
  }, [])

  useEffect(() => { imageRef.current = image }, [image])
  useEffect(() => () => revokeLoadedImage(imageRef.current), [])

  const resetView = () => { setPosition(INITIAL_POSITION); setZoom(1) }
  const resetSettings = () => {
    setFormat('png'); setQuality('original'); setBackgroundMode('white'); setCustomBackground('#056CF2'); setExportInfo(null); resetView()
  }

  const background = useMemo(() => format === 'jpg'
    ? { type: 'solid', color1: backgroundMode === 'custom' ? customBackground : BACKGROUND_COLORS[backgroundMode] }
    : { type: 'transparent' }, [backgroundMode, customBackground, format])

  useEffect(() => {
    if (!image?.element) return undefined
    const generation = ++estimateGenerationRef.current
    const timer = window.setTimeout(async () => {
      setEstimating(true)
      try {
        const size = await estimateConvertedSize({ image: image.element, format, quality, background })
        if (generation === estimateGenerationRef.current) setEstimatedSize(size)
      } catch {
        if (generation === estimateGenerationRef.current) setEstimatedSize(null)
      } finally {
        if (generation === estimateGenerationRef.current) setEstimating(false)
      }
    }, 260)
    return () => window.clearTimeout(timer)
  }, [background, format, image, quality])

  const handleFileSelect = async (file) => {
    setBusy(true); setError(''); setFeedback('')
    try {
      const loaded = await loadImageFile(file, { types: CONVERTER_IMAGE_TYPES, formatMessage: CONVERTER_FORMAT_MESSAGE })
      revokeLoadedImage(imageRef.current); imageRef.current = loaded; setImage(loaded); resetSettings()
      setFeedback('Imagem carregada. Escolha o formato de destino.')
    } catch (loadError) { setError(loadError.message) } finally { setBusy(false) }
  }

  const renderConversion = async (targetFormat = format) => {
    if (!image?.element) throw new Error('Selecione uma imagem antes de converter.')
    if (targetFormat === 'avif' && !avifSupported) throw new Error('AVIF não está disponível para exportação neste navegador.')
    const width = image.element.naturalWidth || image.element.width
    const height = image.element.naturalHeight || image.element.height
    return convertImage({ image: image.element, format: targetFormat, quality, background: targetFormat === 'jpg' ? background : { type: 'transparent' }, outputWidth: width, outputHeight: height })
  }

  const runExport = async (action) => {
    setBusy(true); setError(''); setFeedback('')
    try { await action() }
    catch (conversionError) { setError(conversionError.message || 'Não foi possível converter a imagem.') }
    finally { setBusy(false) }
  }

  const handleDownload = () => runExport(async () => {
    const converted = await renderConversion()
    const config = EXPORT_FORMATS[format]
    downloadBlob(converted.blob, createConvertedFilename(image.name, config.extension))
    setExportInfo({ format: format.toUpperCase(), width: converted.width, height: converted.height, size: converted.blob.size })
    setEstimatedSize(converted.blob.size)
    setFeedback('Conversão concluída e download iniciado.')
  })

  const handleCopy = () => runExport(async () => {
    const converted = await renderConversion()
    await copyImageBlob(converted.blob)
    setExportInfo({ format: format.toUpperCase(), width: converted.width, height: converted.height, size: converted.blob.size })
    setFeedback('Imagem convertida copiada para a área de transferência.')
  })

  const handleNewImage = () => {
    estimateGenerationRef.current += 1
    revokeLoadedImage(imageRef.current); imageRef.current = null; setImage(null); setEstimatedSize(null); setEstimating(false); setError(''); setFeedback(''); resetSettings()
  }

  const previewDimensions = image?.element ? getImagePreviewDimensions(image.element) : null
  const showBackground = Boolean(image && format === 'jpg' && image.file.type !== 'image/jpeg' && image.file.type !== 'image/jpg')
  const copySupported = typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.write) && typeof ClipboardItem !== 'undefined'

  return (
    <ImageToolLayout
      className={`bds-convert-tool ${image ? 'has-image' : 'is-empty'}`}
      icon={RefreshCw}
      title="Converter Imagem"
      description="Converta imagens entre formatos diretamente no navegador, preservando a resolução original."
      hideHeader
      hideSectionHeaders
      error={error}
      feedback={feedback}
      upload={<ImageUpload accept={CONVERTER_IMAGE_ACCEPT} compact={Boolean(image)} filename={image?.name} help="PNG, JPG, JPEG, WEBP, AVIF ou SVG, até 20 MB." onFileSelect={handleFileSelect} preview={image?.src} />}
      settings={image ? <ConvertImageControls avifSupported={avifSupported} backgroundMode={backgroundMode} customBackground={customBackground} format={format} onBackgroundModeChange={setBackgroundMode} onCenter={() => setPosition(INITIAL_POSITION)} onCustomBackgroundChange={setCustomBackground} onFormatChange={setFormat} onQualityChange={setQuality} onReset={resetView} onZoomChange={setZoom} quality={quality} showBackground={showBackground} zoom={zoom} /> : null}
      preview={image ? <div className="bds-convert-preview"><ImagePreviewCanvas background={background} edgeInset={0} fit="stretch" format={format} image={image.element} interactionMode="view" onError={(previewError) => setError(previewError.message)} onPositionChange={setPosition} onReset={resetView} onZoomChange={setZoom} outputHeight={previewDimensions.height} outputWidth={previewDimensions.width} position={position} quality="high" shape="square" surfaceBackground="checker" zoom={zoom} /><ConvertImageInfo estimatedSize={estimatedSize} estimating={estimating} exportInfo={exportInfo} format={format} image={image} /></div> : null}
      exportPanel={image ? <ImageExportPanel busy={busy || estimating} copyDisabled={!copySupported} format={format} onClear={() => { resetSettings(); setFeedback('Configurações restauradas.') }} onCopy={handleCopy} onDownload={handleDownload} onFormatChange={setFormat} onNewImage={handleNewImage} onQualityChange={setQuality} quality={quality} showFormat={false} showQuality={false} /> : null}
    />
  )
}
