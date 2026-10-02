import { Download, ExternalLink, RotateCcw, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  downloadBlob,
  formatBytes,
  getImagePreviewDimensions,
  ImageInfoPanel,
  ImagePreviewCanvas,
  ImageToolLayout,
  ImageUpload,
  loadImageFile,
  revokeLoadedImage,
} from '../../../image-tools'
import {
  buildStorageLinks,
  getStorageFormatLabel,
  STORAGE_IMAGE_ACCEPT,
  STORAGE_IMAGE_TYPES,
  STORAGE_STATUS,
  STORAGE_STATUS_LABELS,
  useStorage,
  validateStorageImageFile,
  validateSvgFile,
} from '../../../storage'
import StorageHistory from './StorageHistory'
import StorageLinks from './StorageLinks'
import './storageManager.css'

const INITIAL_POSITION = { x: 0, y: 0 }

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export default function StorageManagerTool() {
  const imageRef = useRef(null)
  const { upload, download, delete: deleteFile, capabilities, operation, resetOperation } = useStorage()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [history, setHistory] = useState([])
  const [image, setImage] = useState(null)
  const [position, setPosition] = useState(INITIAL_POSITION)
  const [result, setResult] = useState(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => { imageRef.current = image }, [image])
  useEffect(() => () => revokeLoadedImage(imageRef.current), [])

  const resetView = () => {
    setPosition(INITIAL_POSITION)
    setZoom(1)
  }

  const handleFileSelect = async (file) => {
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      const validationError = validateStorageImageFile(file) || await validateSvgFile(file)
      if (validationError) throw new Error(validationError)
      const loaded = await loadImageFile(file, {
        types: Object.keys(STORAGE_IMAGE_TYPES),
        formatMessage: 'Use uma imagem PNG, JPG, JPEG, WEBP, AVIF, GIF ou SVG.',
      })
      revokeLoadedImage(imageRef.current)
      imageRef.current = loaded
      setImage(loaded)
      setResult(null)
      resetOperation()
      resetView()
      setFeedback('Imagem validada e pronta para hospedar.')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async () => {
    if (!image?.file) return
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      const asset = await upload(image.file)
      const width = image.element.naturalWidth || image.element.width
      const height = image.element.naturalHeight || image.element.height
      const completed = { ...asset, width, height, status: 'completed' }
      setResult(completed)
      setHistory((current) => [completed, ...current.filter((item) => item.id !== completed.id)])
      setFeedback('Imagem hospedada com sucesso.')
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async (type, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(type)
      setFeedback('Conteúdo copiado para a área de transferência.')
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setError('O navegador não permitiu copiar este conteúdo.')
    }
  }

  const handleDownload = async () => {
    if (!result) return
    setBusy(true)
    setError('')
    try {
      const blob = await download(result.id)
      downloadBlob(blob, result.originalName || result.name)
      setFeedback('Download iniciado.')
    } catch (downloadError) {
      setError(downloadError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!result || !window.confirm('Excluir esta imagem hospedada?')) return
    setBusy(true)
    setError('')
    try {
      await deleteFile(result.id)
      setHistory((current) => current.map((item) => item.id === result.id ? { ...item, status: 'deleted' } : item))
      setResult((current) => ({ ...current, status: 'deleted' }))
      setFeedback('Imagem excluída do armazenamento.')
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleNewImage = () => {
    revokeLoadedImage(imageRef.current)
    imageRef.current = null
    setImage(null)
    setResult(null)
    setError('')
    setFeedback('')
    resetOperation()
    resetView()
  }

  const links = useMemo(() => result?.status === 'deleted' ? null : buildStorageLinks(result), [result])
  const width = image?.element ? image.element.naturalWidth || image.element.width : 0
  const height = image?.element ? image.element.naturalHeight || image.element.height : 0
  const previewDimensions = image?.element ? getImagePreviewDimensions(image.element) : null
  const infoItems = image ? [
    { label: 'Nome', value: image.name },
    { label: 'Formato', value: getStorageFormatLabel(image.file.type) },
    { label: 'Tipo MIME', value: image.file.type },
    { label: 'Peso', value: formatBytes(image.file.size) },
    { label: 'Dimensões', value: `${width} × ${height}px` },
    { label: 'URL', value: result?.publicUrl },
    { label: 'Data', value: result?.createdAt ? formatDate(result.createdAt) : null },
  ] : []
  const uploading = busy || [STORAGE_STATUS.PREPARING, STORAGE_STATUS.UPLOADING, STORAGE_STATUS.PROCESSING].includes(operation.status)

  const settings = image ? (
    <div className="bds-storage-settings">
      <div className={`bds-storage-progress is-${operation.status}`}>
        <div><strong>{STORAGE_STATUS_LABELS[operation.status]}</strong><span>{operation.progress}%</span></div>
        <progress aria-label="Progresso do envio" max="100" value={operation.progress} />
      </div>
      <button className="bds-storage-primary" disabled={uploading || result?.status === 'completed'} onClick={handleUpload} type="button"><UploadCloud size={16} aria-hidden="true" />{result?.status === 'completed' ? 'Imagem hospedada' : 'Hospedar imagem'}</button>
      <div className="bds-storage-view-controls">
        <strong>Visualização</strong>
        <span><button onClick={() => setPosition(INITIAL_POSITION)} type="button">Centralizar</button><button onClick={resetView} type="button"><RotateCcw size={14} aria-hidden="true" />Resetar</button></span>
      </div>
      <label className="bds-storage-zoom"><span>Zoom</span><input aria-label="Zoom do preview" max="3" min="0.5" onChange={(event) => setZoom(Number(event.target.value))} step="0.05" type="range" value={zoom} /><small>{Math.round(zoom * 100)}%</small></label>
      {!capabilities.cancel && uploading && <p>O provedor ativo não oferece cancelamento seguro durante o envio.</p>}
    </div>
  ) : null

  const preview = image ? (
    <>
      <ImagePreviewCanvas edgeInset={0} fit="stretch" image={image.element} interactionMode="view" onError={(previewError) => setError(previewError.message)} onPositionChange={setPosition} onReset={resetView} onZoomChange={setZoom} outputHeight={previewDimensions.height} outputWidth={previewDimensions.width} position={position} shape="square" surfaceBackground="checker" zoom={zoom} />
      <ImageInfoPanel items={infoItems} />
    </>
  ) : null

  const resultPanel = image || history.length ? (
    <div className="bds-storage-result">
      <StorageLinks copied={copied} links={links} onCopy={handleCopy} />
      {result && (
        <section className="bds-storage-actions" aria-label="Ações da imagem">
          {links && <button onClick={() => handleCopy('direct', links.direct)} type="button">Copiar link</button>}
          {links && <a href={result.publicUrl} rel="noreferrer" target="_blank"><ExternalLink size={16} aria-hidden="true" />Abrir imagem</a>}
          {result.status !== 'deleted' && <button disabled={busy} onClick={handleDownload} type="button"><Download size={16} aria-hidden="true" />Baixar</button>}
          {result.status !== 'deleted' && capabilities.delete && <button className="is-danger" disabled={busy} onClick={handleDelete} type="button"><Trash2 size={16} aria-hidden="true" />Excluir</button>}
          <button onClick={handleNewImage} type="button">Nova imagem</button>
        </section>
      )}
      <StorageHistory items={history} />
    </div>
  ) : null

  return (
    <ImageToolLayout
      description="Hospede uma imagem com segurança e receba links prontos para usar."
      error={error}
      exportPanel={resultPanel}
      exportTitle="Armazenamento"
      feedback={feedback}
      icon={UploadCloud}
      preview={preview}
      settings={settings}
      title="Hospedar"
      upload={<ImageUpload accept={STORAGE_IMAGE_ACCEPT} compact={Boolean(image)} filename={image?.name} help="PNG, JPG, JPEG, WEBP, AVIF, GIF ou SVG, até 20 MB." onFileSelect={handleFileSelect} preview={image?.src} />}
    />
  )
}
