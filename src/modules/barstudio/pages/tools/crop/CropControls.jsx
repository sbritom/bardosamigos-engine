function CropControls({ onCenter, onCrop, onReset, onZoomChange, zoom }) {
  return (
    <section className="bds-barstudio-crop-controls" aria-label="Controles do recorte">
      <div className="bds-barstudio-crop-controls__header">
        <strong>Ajustes do recorte</strong>
        <span>Use zoom e posição para enquadrar a imagem.</span>
      </div>
      <label className="bds-barstudio-crop-zoom">
        <span>Zoom</span>
        <div>
          <span aria-hidden="true">−</span>
          <input
            aria-label="Zoom da imagem"
            max="3"
            min="1"
            onChange={(event) => onZoomChange(Number(event.target.value))}
            step="0.05"
            type="range"
            value={zoom}
          />
          <span aria-hidden="true">+</span>
        </div>
      </label>
      <div className="bds-barstudio-crop-actions">
        <button onClick={onCenter} type="button">Centralizar</button>
        <button onClick={onReset} type="button">Restaurar</button>
        <button className="is-primary" onClick={onCrop} type="button">Cortar</button>
      </div>
    </section>
  )
}

export default CropControls
