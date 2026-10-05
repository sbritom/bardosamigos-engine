import { formatBytes } from '../../../image-tools'

export default function RemoveBackgroundInfo({ image, result, exportInfo }) {
  const sourceWidth = image.element.naturalWidth || image.element.width
  const sourceHeight = image.element.naturalHeight || image.element.height
  const sourceFormat = image.file.type.replace('image/', '').toUpperCase().replace('JPEG', 'JPG')
  const rows = [
    ['Arquivo', image.name],
    ['Formato', sourceFormat],
    ['Resolução', `${sourceWidth} × ${sourceHeight}px`],
    ['Tamanho', formatBytes(image.file.size)],
  ]

  return (
    <div className="bds-remove-bg-info">
      <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd title={value}>{value}</dd></div>)}</dl>
      {result && <p>Preview processado: {result.width} × {result.height}px · {formatBytes(result.size)}</p>}
      {exportInfo && <p className="is-export">Última exportação: {exportInfo.format} · {exportInfo.width} × {exportInfo.height}px · {formatBytes(exportInfo.size)}</p>}
    </div>
  )
}
