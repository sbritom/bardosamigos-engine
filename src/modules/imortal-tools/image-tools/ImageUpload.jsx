import { ImagePlus, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { IMAGE_ACCEPT } from './imageToolUtils'

export default function ImageUpload({ onFileSelect, preview, filename, compact = false, accept = IMAGE_ACCEPT, help = 'PNG, JPG, JPEG, WEBP ou AVIF, até 20 MB.' }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const selectFile = (file) => {
    if (file) onFileSelect(file)
  }

  return (
    <div
      aria-label="Selecionar imagem"
      className={`bds-image-upload ${dragging ? 'is-dragging' : ''} ${compact ? 'is-compact' : ''}`.trim()}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        selectFile(event.dataTransfer.files?.[0])
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <input
        accept={accept}
        aria-label="Arquivo de imagem"
        onChange={(event) => {
          selectFile(event.target.files?.[0])
          event.target.value = ''
        }}
        ref={inputRef}
        type="file"
      />
      {preview ? <img src={preview} alt="Miniatura da imagem selecionada" /> : <ImagePlus size={30} aria-hidden="true" />}
      <div>
        <strong>{filename || 'Arraste uma imagem ou clique para selecionar'}</strong>
        <span>{help}</span>
      </div>
      <span className="bds-image-upload__action"><Upload size={16} aria-hidden="true" />Selecionar</span>
    </div>
  )
}
