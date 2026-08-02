import { RotateCcw } from 'lucide-react'
import { ImageColorField } from '../../../image-tools'
import { CONVERSION_FORMATS, METADATA_NOTICE } from './imageConversionService'

const BACKGROUNDS = [
  ['white', 'Branco'],
  ['black', 'Preto'],
  ['gray', 'Cinza'],
  ['custom', 'Personalizado'],
]

export default function ConvertImageControls({ format, onFormatChange, quality, onQualityChange, avifSupported, showBackground, backgroundMode, onBackgroundModeChange, customBackground, onCustomBackgroundChange, zoom, onZoomChange, onCenter, onReset }) {
  const sliderValue = quality === 'original' ? 100 : Number(quality)

  return (
    <div className="bds-convert-controls">
      <div className="bds-convert-group">
        <strong>Formato de destino</strong>
        <div className="bds-convert-formats" role="radiogroup" aria-label="Formato de destino">
          {Object.entries(CONVERSION_FORMATS).map(([value, option]) => {
            const disabled = value === 'avif' && !avifSupported
            return (
              <button aria-checked={format === value} className={format === value ? 'is-selected' : ''} disabled={disabled} key={value} onClick={() => onFormatChange(value)} role="radio" type="button">
                <span>{option.label}</span>
                <small>{disabled ? 'Indisponível neste navegador.' : option.description}</small>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bds-convert-group">
        <div className="bds-convert-quality-title"><strong>Qualidade</strong><button aria-pressed={quality === 'original'} className={quality === 'original' ? 'is-selected' : ''} disabled={format === 'png'} onClick={() => onQualityChange('original')} type="button">Original</button></div>
        <label className="bds-convert-range">
          <span>{format === 'png' ? 'PNG utiliza qualidade sem perdas.' : `${sliderValue}%`}</span>
          <input aria-label="Qualidade da exportação" disabled={format === 'png'} max="100" min="50" step="10" type="range" value={sliderValue} onChange={(event) => onQualityChange(Number(event.target.value))} />
          <div aria-hidden="true"><small>50%</small><small>60%</small><small>70%</small><small>80%</small><small>90%</small><small>100%</small></div>
        </label>
      </div>

      {showBackground && (
        <div className="bds-convert-group">
          <strong>Fundo da transparência</strong>
          <div className="bds-convert-backgrounds" role="group" aria-label="Cor de fundo para JPG">
            {BACKGROUNDS.map(([value, label]) => <button aria-pressed={backgroundMode === value} className={backgroundMode === value ? 'is-selected' : ''} key={value} onClick={() => onBackgroundModeChange(value)} type="button">{label}</button>)}
          </div>
          {backgroundMode === 'custom' && <ImageColorField label="Cor personalizada" value={customBackground} onChange={onCustomBackgroundChange} />}
        </div>
      )}

      <div className="bds-convert-group">
        <label className="bds-convert-metadata"><input checked={false} disabled type="checkbox" /><span>Preservar metadados</span></label>
        <p>{METADATA_NOTICE}</p>
      </div>

      <div className="bds-convert-group">
        <div className="bds-convert-view-title"><strong>Visualização</strong><span><button onClick={onCenter} type="button">Centralizar</button><button onClick={onReset} type="button"><RotateCcw size={14} />Resetar</button></span></div>
        <label className="bds-convert-zoom"><span>Zoom</span><div><input aria-label="Zoom do preview" max="3" min="0.5" step="0.05" type="range" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} /><input aria-label="Zoom do preview: valor" max="3" min="0.5" step="0.05" type="number" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} /><small>{Math.round(zoom * 100)}%</small></div></label>
      </div>
    </div>
  )
}
