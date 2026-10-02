import { RotateCcw, Upload } from 'lucide-react'
import {
  IMAGE_ACCEPT,
  ImageColorField,
  ImageDecorationControls,
  ImageRangeField,
} from '../../../image-tools'
import { AVATAR_PRESETS, AVATAR_SIZES } from './avatarConfig'

const SHAPES = [
  ['circle', 'Redondo'],
  ['square', 'Quadrado'],
  ['squircle', 'Squircle'],
  ['hexagon', 'Hexágono'],
]

export default function AvatarControls({ settings, onSettingsChange, zoom, onZoomChange, onCenter, onReset, onPreset, onBackgroundFileSelect }) {
  const updateBackground = (patch) => onSettingsChange({ ...settings, background: { ...settings.background, ...patch } })

  return (
    <div className="bds-avatar-controls">
      <div className="bds-avatar-group">
        <strong>Presets</strong>
        <div className="bds-avatar-presets">
          {Object.entries(AVATAR_PRESETS).map(([id, preset]) => <button key={id} onClick={() => onPreset(id)} type="button">{preset.label}</button>)}
        </div>
      </div>

      <div className="bds-avatar-group">
        <strong>Formato</strong>
        <div className="bds-avatar-segments" role="group" aria-label="Formato do avatar">
          {SHAPES.map(([value, label]) => <button aria-pressed={settings.shape === value} className={settings.shape === value ? 'is-selected' : ''} key={value} onClick={() => onSettingsChange({ ...settings, shape: value })} type="button">{label}</button>)}
        </div>
      </div>

      <div className="bds-avatar-group">
        <label className="bds-avatar-field">
          <span>Resolução</span>
          <select value={settings.size} onChange={(event) => onSettingsChange({ ...settings, size: event.target.value === 'custom' ? 'custom' : Number(event.target.value) })}>
            {AVATAR_SIZES.map((size) => <option key={size} value={size}>{size} × {size}</option>)}
            <option value="custom">Personalizado</option>
          </select>
        </label>
        {settings.size === 'custom' && <label className="bds-avatar-field"><span>Tamanho personalizado</span><div className="bds-avatar-custom-size"><input aria-label="Largura e altura em pixels" min="64" max="4096" type="number" value={settings.customSize} onChange={(event) => onSettingsChange({ ...settings, customSize: Number(event.target.value) })} /><small>px</small></div></label>}
      </div>

      <div className="bds-avatar-group">
        <strong>Fundo</strong>
        <label className="bds-avatar-field"><span>Tipo</span><select value={settings.background.type} onChange={(event) => updateBackground({ type: event.target.value })}><option value="transparent">Transparente</option><option value="solid">Cor sólida</option><option value="linear">Gradiente linear</option><option value="radial">Gradiente radial</option><option value="image">Imagem</option></select></label>
        {settings.background.type !== 'transparent' && settings.background.type !== 'image' && <ImageColorField label={settings.background.type === 'radial' ? 'Cor interna' : 'Cor 1'} value={settings.background.color1} onChange={(color1) => updateBackground({ color1 })} />}
        {(settings.background.type === 'linear' || settings.background.type === 'radial') && <ImageColorField label={settings.background.type === 'radial' ? 'Cor externa' : 'Cor 2'} value={settings.background.color2} onChange={(color2) => updateBackground({ color2 })} />}
        {settings.background.type === 'linear' && <label className="bds-avatar-field"><span>Ângulo</span><select value={settings.background.angle} onChange={(event) => updateBackground({ angle: Number(event.target.value) })}>{[0, 45, 90, 135, 180].map((angle) => <option key={angle} value={angle}>{angle}°</option>)}</select></label>}
        {settings.background.type === 'image' && (
          <label className="bds-avatar-background-upload">
            <input accept={IMAGE_ACCEPT} onChange={(event) => onBackgroundFileSelect(event.target.files?.[0])} type="file" />
            <span><Upload size={15} />{settings.background.image?.name || 'Selecionar imagem de fundo'}</span>
          </label>
        )}
      </div>

      <ImageDecorationControls settings={settings} onSettingsChange={onSettingsChange} />

      <div className="bds-avatar-group">
        <label className="bds-avatar-field"><span>Moldura</span><select value={settings.frame} onChange={(event) => onSettingsChange({ ...settings, frame: event.target.value })}><option value="none">Nenhuma</option><option value="plain">Lisa</option><option value="double">Dupla</option><option value="inner">Interna</option><option value="outer">Externa</option></select></label>
      </div>

      <div className="bds-avatar-group">
        <div className="bds-avatar-group-title"><strong>Posicionamento</strong><span><button onClick={onCenter} type="button">Centralizar</button><button onClick={onReset} type="button"><RotateCcw size={14} />Resetar</button></span></div>
        <ImageRangeField label="Zoom" min={1} max={3} step={0.05} value={zoom} onChange={onZoomChange} suffix={`${Math.round(zoom * 100)}%`} />
      </div>
    </div>
  )
}
