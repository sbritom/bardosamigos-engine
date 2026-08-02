import { RotateCcw } from 'lucide-react'
import { ImageColorField } from '../../../image-tools'

export default function RemoveBackgroundControls({ processingQuality, onProcessingQualityChange, smoothing, onSmoothingChange, autoCrop, onAutoCropChange, previewBackground, onPreviewBackgroundChange, customBackground, onCustomBackgroundChange, zoom, onZoomChange, onCenter, onResetZoom }) {
  return (
    <div className="bds-remove-bg-controls">
      <label className="bds-remove-bg-field">
        <span>Qualidade do processamento</span>
        <select value={processingQuality} onChange={(event) => onProcessingQualityChange(event.target.value)}>
          <option value="standard">Padrão</option>
          <option value="high">Alta</option>
          <option value="maximum">Máxima</option>
        </select>
      </label>

      <label className="bds-remove-bg-range">
        <span>Suavização de borda</span>
        <div>
          <input aria-label="Suavização de borda" min="0" max="100" type="range" value={smoothing} onChange={(event) => onSmoothingChange(Number(event.target.value))} />
          <input aria-label="Suavização de borda: valor" min="0" max="100" type="number" value={smoothing} onChange={(event) => onSmoothingChange(Number(event.target.value))} />
          <small>%</small>
        </div>
      </label>

      <label className="bds-remove-bg-toggle">
        <input type="checkbox" checked={autoCrop} onChange={(event) => onAutoCropChange(event.target.checked)} />
        <span>Recorte automático</span>
      </label>

      <div className="bds-remove-bg-group">
        <strong>Fundo do preview</strong>
        <div className="bds-remove-bg-backgrounds" role="group" aria-label="Fundo do preview">
          {[
            ['checker', 'Quadriculado'],
            ['white', 'Branco'],
            ['black', 'Preto'],
            ['gray', 'Cinza'],
            ['custom', 'Personalizado'],
          ].map(([value, label]) => <button aria-pressed={previewBackground === value} className={previewBackground === value ? 'is-selected' : ''} key={value} onClick={() => onPreviewBackgroundChange(value)} type="button">{label}</button>)}
        </div>
        {previewBackground === 'custom' && <ImageColorField label="Cor personalizada" value={customBackground} onChange={onCustomBackgroundChange} />}
      </div>

      <div className="bds-remove-bg-group">
        <div className="bds-remove-bg-group-title">
          <strong>Visualização</strong>
          <span>
            <button onClick={onCenter} type="button">Centralizar</button>
            <button onClick={onResetZoom} type="button"><RotateCcw size={14} />Resetar zoom</button>
          </span>
        </div>
        <label className="bds-remove-bg-range">
          <span>Zoom</span>
          <div>
            <input aria-label="Zoom do preview" min="0.5" max="3" step="0.05" type="range" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} />
            <input aria-label="Zoom do preview: valor" min="0.5" max="3" step="0.05" type="number" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} />
            <small>{Math.round(zoom * 100)}%</small>
          </div>
        </label>
      </div>
    </div>
  )
}
