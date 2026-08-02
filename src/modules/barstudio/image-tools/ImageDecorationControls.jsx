import ImageColorField from './ImageColorField'

export const BORDER_WIDTHS = [0, 2, 4, 6, 8, 10, 12, 16, 20]

export const INITIAL_IMAGE_DECORATION = {
  border: {
    enabled: false,
    width: 4,
    type: 'solid',
    color1: '#FFFFFF',
    color2: '#056CF2',
    angle: 90,
    opacity: 100,
    style: 'plain',
  },
  shadow: {
    enabled: false,
    color: '#000000',
    blur: 16,
    offsetX: 0,
    offsetY: 8,
    opacity: 35,
  },
}

export function ImageRangeField({ label, value, min, max, step = 1, onChange, suffix = '' }) {
  return (
    <label className="bds-image-decoration__range">
      <span>{label}</span>
      <div>
        <input aria-label={label} min={min} max={max} step={step} type="range" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <input aria-label={`${label}: valor`} min={min} max={max} step={step} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  )
}

export function ImageToggle({ checked, label, onChange }) {
  return <label className="bds-image-decoration__toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>
}

export default function ImageDecorationControls({ settings, onSettingsChange }) {
  const updateBorder = (patch) => onSettingsChange({ ...settings, border: { ...settings.border, ...patch } })
  const updateShadow = (patch) => onSettingsChange({ ...settings, shadow: { ...settings.shadow, ...patch } })
  const borderWidthIndex = Math.max(0, BORDER_WIDTHS.indexOf(settings.border.width))

  return (
    <div className="bds-image-decoration">
      <div className="bds-image-decoration__group">
        <ImageToggle checked={settings.border.enabled} label="Adicionar borda" onChange={(enabled) => updateBorder({ enabled })} />
        {settings.border.enabled && (
          <div className="bds-image-decoration__options">
            <label className="bds-image-decoration__field">
              <span>Espessura</span>
              <div className="bds-image-decoration__thickness">
                <input aria-label="Espessura da borda" min="0" max={BORDER_WIDTHS.length - 1} step="1" type="range" value={borderWidthIndex} onChange={(event) => updateBorder({ width: BORDER_WIDTHS[Number(event.target.value)] })} />
                <input aria-label="Espessura da borda em pixels" list="image-border-width-values" min="0" max="20" type="number" value={settings.border.width} onChange={(event) => { const value = Number(event.target.value); updateBorder({ width: BORDER_WIDTHS.reduce((closest, item) => Math.abs(item - value) < Math.abs(closest - value) ? item : closest, 0) }) }} />
                <small>px</small>
              </div>
            </label>
            <datalist id="image-border-width-values">{BORDER_WIDTHS.map((value) => <option key={value} value={value} />)}</datalist>
            <label className="bds-image-decoration__field"><span>Preenchimento</span><select value={settings.border.type} onChange={(event) => updateBorder({ type: event.target.value })}><option value="solid">Cor sólida</option><option value="linear">Gradiente linear</option><option value="radial">Gradiente radial</option></select></label>
            <ImageColorField label={settings.border.type === 'radial' ? 'Cor interna' : 'Cor 1'} value={settings.border.color1} onChange={(color1) => updateBorder({ color1 })} />
            {settings.border.type !== 'solid' && <ImageColorField label={settings.border.type === 'radial' ? 'Cor externa' : 'Cor 2'} value={settings.border.color2} onChange={(color2) => updateBorder({ color2 })} />}
            {settings.border.type === 'linear' && <label className="bds-image-decoration__field"><span>Ângulo</span><select value={settings.border.angle} onChange={(event) => updateBorder({ angle: Number(event.target.value) })}>{[0, 45, 90, 135, 180].map((angle) => <option key={angle} value={angle}>{angle}°</option>)}</select></label>}
            <label className="bds-image-decoration__field"><span>Estilo</span><select value={settings.border.style} onChange={(event) => updateBorder({ style: event.target.value })}><option value="plain">Lisa</option><option value="dashed">Tracejada</option><option value="dotted">Pontilhada</option></select></label>
            <ImageRangeField label="Opacidade" min={0} max={100} value={settings.border.opacity} onChange={(opacity) => updateBorder({ opacity })} suffix="%" />
          </div>
        )}
      </div>

      <div className="bds-image-decoration__group">
        <ImageToggle checked={settings.shadow.enabled} label="Aplicar sombra" onChange={(enabled) => updateShadow({ enabled })} />
        {settings.shadow.enabled && (
          <div className="bds-image-decoration__options">
            <ImageColorField label="Cor da sombra" value={settings.shadow.color} onChange={(color) => updateShadow({ color })} />
            <ImageRangeField label="Blur" min={0} max={40} value={settings.shadow.blur} onChange={(blur) => updateShadow({ blur })} suffix="px" />
            <ImageRangeField label="Offset X" min={-30} max={30} value={settings.shadow.offsetX} onChange={(offsetX) => updateShadow({ offsetX })} suffix="px" />
            <ImageRangeField label="Offset Y" min={-30} max={30} value={settings.shadow.offsetY} onChange={(offsetY) => updateShadow({ offsetY })} suffix="px" />
            <ImageRangeField label="Opacidade" min={0} max={100} value={settings.shadow.opacity} onChange={(opacity) => updateShadow({ opacity })} suffix="%" />
          </div>
        )}
      </div>
    </div>
  )
}
