import { Clipboard, Download, Eraser, ImagePlus } from 'lucide-react'

export const EXPORT_FORMATS = {
  png: { extension: 'png', mime: 'image/png' },
  webp: { extension: 'webp', mime: 'image/webp' },
  jpg: { extension: 'jpg', mime: 'image/jpeg' },
  avif: { extension: 'avif', mime: 'image/avif' },
}

export const EXPORT_QUALITY = {
  original: { label: 'Original', value: 1 },
  high: { label: 'Alta', value: 0.92 },
  medium: { label: 'Média', value: 0.8 },
  low: { label: 'Baixa', value: 0.65 },
}

const DEFAULT_FORMATS = ['png', 'webp', 'jpg']

export default function ImageExportPanel({ format, quality, onFormatChange, onQualityChange, onDownload, onCopy, onClear, onNewImage, busy = false, copyDisabled = false, extraActions, formats = DEFAULT_FORMATS, qualityOptions = EXPORT_QUALITY, showFormat = true, showQuality = true }) {
  return (
    <div className="bds-image-export">
      {showFormat && <label>
        <span>Formato</span>
        <select value={format} onChange={(event) => onFormatChange(event.target.value)}>
          {formats.map((item) => {
            const option = typeof item === 'string' ? { value: item, label: item.toUpperCase() } : item
            return <option disabled={option.disabled} key={option.value} value={option.value}>{option.label}</option>
          })}
        </select>
      </label>}
      {showQuality && <label>
        <span>Qualidade</span>
        <select value={quality} onChange={(event) => onQualityChange(event.target.value)}>
          {Object.entries(qualityOptions).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
        </select>
      </label>}
      <div className="bds-image-export__actions">
        {extraActions}
        <button className="is-primary" disabled={busy} onClick={onDownload} type="button"><Download size={16} />Baixar</button>
        <button disabled={busy || copyDisabled} onClick={onCopy} type="button"><Clipboard size={16} />Copiar imagem</button>
        <button disabled={busy} onClick={onClear} type="button"><Eraser size={16} />Limpar</button>
        <button disabled={busy} onClick={onNewImage} type="button"><ImagePlus size={16} />Nova imagem</button>
      </div>
    </div>
  )
}
