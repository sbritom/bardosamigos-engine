import { useRef, useState } from 'react'

function CropUpload({ error, onFileSelect }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const openFilePicker = () => inputRef.current?.click()

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const [file] = event.dataTransfer.files
    onFileSelect(file)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openFilePicker()
    }
  }

  return (
    <div
      aria-label="Selecionar imagem para recorte circular"
      className={dragActive ? 'bds-barstudio-crop-upload is-drag-active' : 'bds-barstudio-crop-upload'}
      onClick={openFilePicker}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <input
        accept="image/png,image/jpeg,image/jpg,image/webp"
        aria-label="Arquivo de imagem"
        onChange={(event) => onFileSelect(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <span className="bds-barstudio-crop-upload__icon">⭕</span>
      <div className="bds-barstudio-crop-upload__content">
        <strong>Arraste sua imagem para começar</strong>
        <span>ou selecione um arquivo do seu dispositivo.</span>
      </div>
      <span className="bds-barstudio-crop-upload__button">Selecionar imagem</span>
      <small>Formatos aceitos: PNG, JPG, JPEG e WEBP.</small>
      {error ? <em>{error}</em> : null}
    </div>
  )
}

export default CropUpload
