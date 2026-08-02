import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { IMAGE_PREVIEW_BASE_SIZE, renderImagePreview } from './imagePreviewRenderer'

const PreviewSurface = memo(function PreviewSurface({ item, config, interactionMode, surfaceBackground, customBackground, position, onPositionChange, onReset, onImageLoaded, onError, help }) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const outputWidth = item.outputWidth || config.outputWidth || IMAGE_PREVIEW_BASE_SIZE
  const outputHeight = item.outputHeight || config.outputHeight || outputWidth

  useEffect(() => {
    try {
      renderImagePreview(canvasRef.current, { ...config, ...item.config, image: item.image, outputWidth, outputHeight, position: interactionMode === 'view' ? { x: 0, y: 0 } : position, zoom: interactionMode === 'view' ? 1 : config.zoom })
    } catch (error) {
      onError?.(error)
    }
  }, [config, interactionMode, item, onError, outputHeight, outputWidth, position])

  useEffect(() => {
    onImageLoaded?.(item.image)
  }, [item.image, onImageLoaded])

  const stopDragging = () => {
    dragRef.current = null
    setDragging(false)
  }

  return (
    <figure className="bds-image-preview-canvas__figure">
      {item.label && <figcaption>{item.label}</figcaption>}
      <div
        aria-label={item.ariaLabel || `${item.label || 'Preview'}. Arraste ou use as setas para posicionar a imagem.`}
        className={`bds-image-preview-canvas__surface is-${surfaceBackground} ${dragging ? 'is-dragging' : ''}`}
        onDoubleClick={onReset}
        onKeyDown={(event) => {
          const amount = (event.shiftKey ? 10 : 2) / event.currentTarget.getBoundingClientRect().width
          if (event.key === 'ArrowLeft') onPositionChange?.({ x: position.x - amount, y: position.y })
          else if (event.key === 'ArrowRight') onPositionChange?.({ x: position.x + amount, y: position.y })
          else if (event.key === 'ArrowUp') onPositionChange?.({ x: position.x, y: position.y - amount })
          else if (event.key === 'ArrowDown') onPositionChange?.({ x: position.x, y: position.y + amount })
          else if (event.key === '0') onReset?.()
          else return
          event.preventDefault()
        }}
        onPointerCancel={stopDragging}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          dragRef.current = { x: event.clientX, y: event.clientY, position, width: event.currentTarget.getBoundingClientRect().width }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return
          onPositionChange?.({
            x: dragRef.current.position.x + (event.clientX - dragRef.current.x) / dragRef.current.width,
            y: dragRef.current.position.y + (event.clientY - dragRef.current.y) / dragRef.current.width,
          })
        }}
        onPointerUp={stopDragging}
        style={{ aspectRatio: `${outputWidth} / ${outputHeight}`, ...(outputHeight > outputWidth ? { width: `min(100%, ${Math.round(430 * outputWidth / outputHeight)}px)` } : {}), ...(surfaceBackground === 'custom' ? { '--bds-image-preview-custom': customBackground } : {}) }}
        tabIndex={0}
      >
        <canvas
          height={outputHeight}
          ref={canvasRef}
          style={interactionMode === 'view' ? { transform: `translate3d(${position.x * 100}%, ${position.y * 100}%, 0) scale(${config.zoom})` } : undefined}
          width={outputWidth}
        />
      </div>
      {help && <p>{help}</p>}
    </figure>
  )
})

function ImagePreviewCanvas({
  image,
  items,
  previewMode = 'result',
  zoom = 1,
  position = { x: 0, y: 0 },
  onZoomChange,
  onPositionChange,
  onReset,
  onImageLoaded,
  onError,
  surfaceBackground = 'checker',
  customBackground = '#7A7A7A',
  interactionMode = 'content',
  help,
  outputWidth,
  outputHeight,
  shape = 'square',
  fit = 'cover',
  border,
  shadow,
  background = { type: 'transparent' },
  frame = 'none',
  format = 'png',
  quality = 'high',
  decorationBaseSize = IMAGE_PREVIEW_BASE_SIZE,
  edgeInset,
}) {
  const sourceItems = useMemo(() => items || [{ id: 'result', image }], [image, items])
  const visibleItems = useMemo(() => previewMode === 'comparison' ? sourceItems.filter((item) => item.image) : sourceItems.filter((item) => item.id === previewMode && item.image), [previewMode, sourceItems])
  const config = useMemo(() => ({ outputWidth, outputHeight, shape, fit, border, shadow, background, frame, format, quality, decorationBaseSize, edgeInset, zoom }), [background, border, decorationBaseSize, edgeInset, fit, format, frame, outputHeight, outputWidth, quality, shadow, shape, zoom])

  return (
    <div
      className={`bds-image-preview-canvas ${visibleItems.length > 1 ? 'is-comparison' : ''}`}
      onWheel={onZoomChange ? (event) => {
        if (!event.ctrlKey) return
        event.preventDefault()
        onZoomChange(Math.min(3, Math.max(0.5, zoom + (event.deltaY > 0 ? -0.05 : 0.05))))
      } : undefined}
    >
      {visibleItems.map((item) => (
        <PreviewSurface
          config={config}
          customBackground={customBackground}
          help={visibleItems.length === 1 ? help : null}
          interactionMode={interactionMode}
          item={item}
          key={item.id}
          onError={onError}
          onImageLoaded={onImageLoaded}
          onPositionChange={onPositionChange}
          onReset={onReset}
          position={position}
          surfaceBackground={surfaceBackground}
        />
      ))}
    </div>
  )
}

export default memo(ImagePreviewCanvas)
