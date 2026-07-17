function CropResult({ image, onDownload, onNewCrop }) {
  if (!image) {
    return null
  }

  return (
    <section className="bds-barstudio-crop-result" aria-label="Resultado do recorte">
      <div className="bds-barstudio-crop-result__status">✓ Corte concluído com sucesso</div>
      <div>
        <span>Preview final</span>
        <strong>Recorte circular pronto</strong>
      </div>
      <img alt="Resultado do recorte circular" src={image} />
      <div className="bds-barstudio-crop-actions">
        <a download="foto-redonda.png" href={image} onClick={onDownload}>Baixar PNG</a>
        <button onClick={onNewCrop} type="button">Novo Recorte</button>
      </div>
    </section>
  )
}

export default CropResult
