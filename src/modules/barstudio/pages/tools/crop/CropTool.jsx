import { useEffect, useState } from 'react'

import CropCanvas, { CANVAS_SIZE, drawCircularImage } from './CropCanvas'
import CropControls from './CropControls'
import CropResult from './CropResult'
import CropUpload from './CropUpload'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const INITIAL_OFFSET = { x: 0, y: 0 }
const INITIAL_ZOOM = 1

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => resolve({ image, objectUrl })
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível carregar a imagem.'))
    }
    image.src = objectUrl
  })
}

function CropTool() {
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [image, setImage] = useState(null)
  const [offset, setOffset] = useState(INITIAL_OFFSET)
  const [result, setResult] = useState('')
  const [zoom, setZoom] = useState(INITIAL_ZOOM)

  useEffect(() => () => {
    if (image?.src) {
      URL.revokeObjectURL(image.src)
    }
  }, [image])

  const resetAdjustments = () => {
    setOffset(INITIAL_OFFSET)
    setZoom(INITIAL_ZOOM)
  }

  const handleFileSelect = async (file) => {
    if (!file) {
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Use uma imagem PNG, JPG, JPEG ou WEBP.')
      return
    }

    try {
      const loaded = await loadImage(file)

      if (image?.src) {
        URL.revokeObjectURL(image.src)
      }

      setImage({ element: loaded.image, name: file.name, src: loaded.objectUrl })
      setResult('')
      setError('')
      setFeedback('Imagem carregada. Ajuste o enquadramento para cortar.')
      resetAdjustments()
    } catch (loadError) {
      setError(loadError.message)
      setFeedback('')
    }
  }

  const handleCrop = () => {
    if (!image?.element) {
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    drawCircularImage(canvas, image.element, zoom, offset)
    setResult(canvas.toDataURL('image/png'))
    setFeedback('Corte concluído com sucesso.')
  }

  const handleNewCrop = () => {
    setResult('')
    setImage(null)
    setError('')
    setFeedback('')
    resetAdjustments()
  }

  return (
    <div className="bds-barstudio-crop-tool">
      <header className="bds-barstudio-crop-header">
        <span>⭕</span>
        <div>
          <h1>Cortar Foto Redonda</h1>
          <p>Recorte imagens em formato circular com alta qualidade.</p>
        </div>
      </header>

      {!image ? (
        <CropUpload error={error} onFileSelect={handleFileSelect} />
      ) : (
        <div className="bds-barstudio-crop-editor">
          <CropCanvas image={image.element} offset={offset} onOffsetChange={setOffset} zoom={zoom} />
          <CropControls
            onCenter={() => {
              setOffset(INITIAL_OFFSET)
              setFeedback('Imagem centralizada.')
            }}
            onCrop={handleCrop}
            onReset={() => {
              resetAdjustments()
              setFeedback('Ajustes restaurados.')
            }}
            onZoomChange={setZoom}
            zoom={zoom}
          />
          {feedback ? <p className="bds-barstudio-crop-feedback" role="status">{feedback}</p> : null}
          <CropResult
            image={result}
            onDownload={() => setFeedback('Download iniciado.')}
            onNewCrop={handleNewCrop}
          />
        </div>
      )}
    </div>
  )
}

export default CropTool
