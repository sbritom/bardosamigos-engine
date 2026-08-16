import { Copy, Lock, Palette, RefreshCw, Shuffle, Unlock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { hexToRgb, hslToHex, normalizeHex, rgbToHsl } from '../../../image-tools/imageToolUtils'
import './palettesTool.css'

const HARMONIES = [
  { id: 'analogous', label: 'Análoga' },
  { id: 'complementary', label: 'Complementar' },
  { id: 'monochromatic', label: 'Monocromática' },
  { id: 'triadic', label: 'Tríade' },
  { id: 'tetradic', label: 'Tetrádica' },
]

function wrapHue(value) {
  return ((value % 360) + 360) % 360
}

function buildOffsets(type, count) {
  const presets = {
    analogous: [-60, -30, 0, 30, 60, 90, 120, 150],
    complementary: [0, 180, 20, 200, -20, 160, 40, 220],
    triadic: [0, 120, 240, 30, 150, 270, 60, 180],
    tetradic: [0, 90, 180, 270, 30, 120, 210, 300],
  }
  return (presets[type] || presets.analogous).slice(0, count)
}

function generatePalette(base, type, count) {
  const hsl = rgbToHsl(hexToRgb(base))
  if (type === 'monochromatic') {
    return Array.from({ length: count }, (_, index) => {
      const position = count === 1 ? 0.5 : index / (count - 1)
      const lightness = Math.round(18 + position * 68)
      const saturation = Math.max(18, Math.min(100, hsl.s + (index % 2 ? -8 : 5)))
      return hslToHex(hsl.h, saturation, lightness)
    })
  }
  return buildOffsets(type, count).map((offset, index) => {
    const lightnessShift = ((index % 3) - 1) * 7
    return hslToHex(wrapHue(hsl.h + offset), Math.max(28, hsl.s), Math.max(18, Math.min(82, hsl.l + lightnessShift)))
  })
}

function randomHex() {
  return `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()}`
}

async function copyText(value, setFeedback) {
  try {
    await navigator.clipboard.writeText(value)
    setFeedback('Copiado!')
  } catch {
    setFeedback('Não foi possível copiar automaticamente.')
  }
  window.setTimeout(() => setFeedback(''), 1400)
}

export default function PalettesTool() {
  const [baseColor, setBaseColor] = useState('#056CF2')
  const [harmony, setHarmony] = useState('analogous')
  const [count, setCount] = useState(5)
  const [locked, setLocked] = useState({})
  const [overrides, setOverrides] = useState({})
  const [feedback, setFeedback] = useState('')

  const generated = useMemo(() => generatePalette(baseColor, harmony, count), [baseColor, harmony, count])
  const colors = generated.map((color, index) => overrides[index] || color)

  const regenerate = () => {
    const nextBase = randomHex()
    setBaseColor(nextBase)
    const fresh = generatePalette(nextBase, harmony, count)
    const nextOverrides = {}
    colors.forEach((color, index) => {
      if (locked[index]) nextOverrides[index] = color
      else nextOverrides[index] = fresh[index]
    })
    setOverrides(nextOverrides)
  }

  const changeBase = (value) => {
    const normalized = normalizeHex(value)
    if (!normalized) return
    setBaseColor(normalized)
    setOverrides((current) => Object.fromEntries(Object.entries(current).filter(([index]) => locked[index])))
  }

  const cssVariables = colors.map((color, index) => `--palette-${index + 1}: ${color};`).join('\n')

  return (
    <div className="bds-palettes-tool">
      {feedback && <div className="bds-palettes-tool__feedback" role="status">{feedback}</div>}
      <div className="bds-palettes-tool__workspace">
        <aside className="bds-palettes-tool__controls">
          <div className="bds-palettes-tool__control">
            <label htmlFor="palette-base">Cor-base</label>
            <div className="bds-palettes-tool__base">
              <input id="palette-base-picker" type="color" value={baseColor} onChange={(event) => changeBase(event.target.value)} />
              <input id="palette-base" value={baseColor} onChange={(event) => changeBase(event.target.value)} maxLength={7} />
            </div>
          </div>

          <div className="bds-palettes-tool__control">
            <label htmlFor="palette-harmony">Harmonia</label>
            <select id="palette-harmony" value={harmony} onChange={(event) => { setHarmony(event.target.value); setOverrides({}) }}>
              {HARMONIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>

          <div className="bds-palettes-tool__control">
            <label htmlFor="palette-count">Quantidade</label>
            <select id="palette-count" value={count} onChange={(event) => { setCount(Number(event.target.value)); setLocked({}); setOverrides({}) }}>
              {[3, 4, 5, 6, 7, 8].map((value) => <option key={value} value={value}>{value} cores</option>)}
            </select>
          </div>

          <button className="bds-button bds-button--primary" type="button" onClick={regenerate}><Shuffle size={16} /> Aleatorizar</button>
          <button className="bds-button" type="button" onClick={() => setOverrides({})}><RefreshCw size={16} /> Gerar da cor-base</button>
          <p className="bds-palettes-tool__hint">Trave as cores que deseja manter antes de aleatorizar.</p>
        </aside>

        <section className="bds-palettes-tool__result" aria-label="Paleta gerada">
          <div className="bds-palettes-tool__strip">
            {colors.map((color, index) => (
              <article className="bds-palettes-tool__color" key={`${index}-${color}`} style={{ background: color }}>
                <button className="bds-palettes-tool__lock" type="button" aria-label={locked[index] ? `Destravar ${color}` : `Travar ${color}`} onClick={() => setLocked((current) => ({ ...current, [index]: !current[index] }))}>
                  {locked[index] ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
                <div className="bds-palettes-tool__color-info">
                  <strong>{color}</strong>
                  <button type="button" onClick={() => copyText(color, setFeedback)} aria-label={`Copiar ${color}`}><Copy size={15} /></button>
                </div>
              </article>
            ))}
          </div>

          <div className="bds-palettes-tool__actions">
            <button className="bds-button bds-button--primary" type="button" onClick={() => copyText(colors.join('  '), setFeedback)}><Copy size={16} /> Copiar HEX</button>
            <button className="bds-button" type="button" onClick={() => copyText(cssVariables, setFeedback)}><Copy size={16} /> Copiar CSS</button>
          </div>
          <div className="bds-palettes-tool__code">
            <span>Variáveis CSS</span>
            <pre>{cssVariables}</pre>
          </div>
        </section>
      </div>
    </div>
  )
}
