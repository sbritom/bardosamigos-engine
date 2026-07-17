import { useEffect, useRef, useState } from 'react'

const CANVAS_SIZE = 360

function drawCircularImage(canvas, image, zoom, offset) {
  const context = canvas.getContext('2d')

  if (!context || !image) {
    return
  }

  const radius = CANVAS_SIZE / 2
  const baseScale = Math.max(CANVAS_SIZE / image.width, CANVAS_SIZE / image.height)
  const width = image.width * baseScale * zoom
  const height = image.height * baseScale * zoom
  const x = (CANVAS_SIZE - width) / 2 + offset.x
  const y = (CANVAS_SIZE - height) / 2 + offset.y

  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  context.save()
  context.beginPath()
  context.arc(radius, radius, radius, 0, Math.PI * 2)
  context.clip()
  context.drawImage(image, x, y, width, height)
  context.restore()

  context.save()
  context.beginPath()
  context.arc(radius, radius, radius - 1, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  context.lineWidth = 2
  context.stroke()
  context.restore()
}

function CropCanvas({ image, offset, onOffsetChange, zoom }) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      drawCircularImage(canvasRef.current, image, zoom, offset)
    }
  }, [image, offset, zoom])

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offset,
    }
    setDragging(true)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current) {
      return
    }

    const deltaX = event.clientX - dragRef.current.x
    const deltaY = event.clientY - dragRef.current.y

    onOffsetChange({
      x: dragRef.current.offset.x + deltaX,
      y: dragRef.current.offset.y + deltaY,
    })
  }

  const handlePointerUp = () => {
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div className="bds-barstudio-crop-preview-grid">
      <section className="bds-barstudio-crop-preview-card" aria-label="Imagem original">
        <header>
          <strong>Imagem original</strong>
          <span>Referência do arquivo carregado</span>
        </header>
        <div className="bds-barstudio-crop-original">
          <img alt="Imagem original enviada" src={image.src} />
        </div>
      </section>
      <section className="bds-barstudio-crop-preview-card" aria-label="Preview circular">
        <header>
          <strong>Preview circular</strong>
          <span>Arraste a imagem para posicionar</span>
        </header>
        <canvas
          aria-label="Prévia circular do recorte. Arraste para mover a imagem."
          className={dragging ? 'bds-barstudio-crop-canvas is-dragging' : 'bds-barstudio-crop-canvas'}
          height={CANVAS_SIZE}
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={canvasRef}
          tabIndex={0}
          width={CANVAS_SIZE}
        />
      </section>
    </div>
  )
}

export { CANVAS_SIZE, drawCircularImage }
export default CropCanvas
