import { formatBytes } from '../../../image-tools'
import { CONVERSION_FORMATS, getImageFormatLabel } from './imageConversionService'

export default function ConvertImageInfo({ image, format, estimatedSize, estimating, exportInfo }) {
  const width = image.element.naturalWidth || image.element.width
  const height = image.element.naturalHeight || image.element.height
  const rows = [
    ['Formato original', getImageFormatLabel(image.file.type)],
    ['Formato de saída', CONVERSION_FORMATS[format].label],
    ['Resolução', `${width} × ${height}px`],
    ['Peso original', formatBytes(image.file.size)],
    ['Estimativa final', estimating ? 'Calculando...' : estimatedSize ? `≈ ${formatBytes(estimatedSize)}` : 'Não disponível'],
    ['Tipo MIME', CONVERSION_FORMATS[format].mime],
  ]

  return (
    <div className="bds-convert-info">
      <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd title={value}>{value}</dd></div>)}</dl>
      {exportInfo && <p>Última exportação: {exportInfo.format} · {exportInfo.width} × {exportInfo.height}px · {formatBytes(exportInfo.size)}</p>}
    </div>
  )
}
