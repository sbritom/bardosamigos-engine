import { formatBytes } from '../../../image-tools'

export default function AvatarInfo({ image, outputSize, format, exportInfo }) {
  const width = image.element.naturalWidth || image.element.width
  const height = image.element.naturalHeight || image.element.height
  const sourceFormat = image.file.type.replace('image/', '').toUpperCase().replace('JPEG', 'JPG')
  return (
    <div className="bds-avatar-info">
      <dl>
        <div><dt>Formato original</dt><dd>{sourceFormat}</dd></div>
        <div><dt>Resolução original</dt><dd>{width} × {height}px</dd></div>
        <div><dt>Peso original</dt><dd>{formatBytes(image.file.size)}</dd></div>
        <div><dt>Formato final</dt><dd>{format.toUpperCase()}</dd></div>
        <div><dt>Resolução final</dt><dd>{outputSize} × {outputSize}px</dd></div>
      </dl>
      {exportInfo && <p>Última exportação: {exportInfo.format} · {exportInfo.width} × {exportInfo.height}px · {formatBytes(exportInfo.size)}</p>}
    </div>
  )
}
