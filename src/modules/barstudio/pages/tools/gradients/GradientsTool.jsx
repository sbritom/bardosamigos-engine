import { Clipboard, Flag, Plus, Sparkles, Trash2, Waves } from 'lucide-react'
import { useMemo, useState } from 'react'
import './gradientsTool.css'

const MODES = [
  { id: 'namecolor', label: 'Namecolor', icon: Sparkles },
  { id: 'namewave', label: 'Namewave', icon: Waves },
  { id: 'nameflag', label: 'Nameflag', icon: Flag },
]

const WAVE_SPEEDS = [
  { id: 'default', label: 'Padrão', code: '', seconds: 2.8 },
  { id: 'o2', label: 'Rápido', code: 'o2', seconds: 2.1 },
  { id: 'o3', label: 'Muito rápido', code: 'o3', seconds: 1.35 },
  { id: 'f1', label: 'Lento', code: 'f1', seconds: 3.8 },
  { id: 'f3', label: 'Mais lento', code: 'f3', seconds: 4.8 },
  { id: 'f4', label: 'Muito lento', code: 'f4', seconds: 6 },
  { id: 'o0', label: 'Parado', code: 'o0', seconds: 0 },
]

const DEFAULT_WAVE_COLORS = ['F45', 'FFBAED', 'E854AF']

function normalizeHex(value, fallback) {
  const cleaned = String(value || '').replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase()
  return cleaned || fallback
}

function normalizeGradientColor(value, fallback = 'FFFFFF') {
  const cleaned = String(value || '').replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase()
  return cleaned || fallback
}

function colorValue(value, fallback) {
  const normalized = normalizeHex(value, fallback)
  if (normalized.length === 3) return `#${normalized}`
  return `#${normalized.padEnd(6, '0').slice(0, 6)}`
}

function gradientCssColor(value) {
  const normalized = normalizeGradientColor(value)
  if (normalized.length === 3) return `#${normalized}`
  return `#${normalized.padEnd(6, '0').slice(0, 6)}`
}

export default function GradientsTool() {
  const [mode, setMode] = useState('namecolor')
  const [text, setText] = useState('BarDosAmigos')
  const [nameColor, setNameColor] = useState('FF0000')
  const [glowEnabled, setGlowEnabled] = useState(false)
  const [glowColor, setGlowColor] = useState('000001')
  const [waveGlowEnabled, setWaveGlowEnabled] = useState(true)
  const [waveGlowColor, setWaveGlowColor] = useState('590539')
  const [waveColors, setWaveColors] = useState(DEFAULT_WAVE_COLORS)
  const [waveRotation, setWaveRotation] = useState(45)
  const [waveShift, setWaveShift] = useState(0)
  const [waveSpeed, setWaveSpeed] = useState('default')
  const [copied, setCopied] = useState(false)

  const generatedCode = useMemo(() => {
    if (mode === 'namecolor') return `(glow#${glowEnabled ? normalizeHex(glowColor, '000001') : '0'}#${normalizeHex(nameColor, 'FF0000')})`
    if (mode === 'namewave') {
      const glow = waveGlowEnabled ? normalizeHex(waveGlowColor, '590539') : '0'
      const colors = waveColors.slice(0, 15).map((color) => normalizeGradientColor(color)).join('#')
      const rotation = Number(waveRotation) ? `#r${Math.max(0, Math.min(360, Number(waveRotation)))}` : ''
      const shift = Number(waveShift) ? `#s${Math.max(-99, Math.min(99, Number(waveShift)))}` : ''
      const speed = WAVE_SPEEDS.find((item) => item.id === waveSpeed)?.code
      return `(glow#${glow}#grad#${colors}${rotation}${shift}${speed ? `#${speed}` : ''})`
    }
    return 'Código do Nameflag será gerado aqui.'
  }, [glowColor, glowEnabled, mode, nameColor, waveColors, waveGlowColor, waveGlowEnabled, waveRotation, waveShift, waveSpeed])

  const waveAnimation = WAVE_SPEEDS.find((item) => item.id === waveSpeed) || WAVE_SPEEDS[0]
  const previewStyle = mode === 'namecolor'
    ? { color: colorValue(nameColor, 'FF0000'), textShadow: glowEnabled ? `0 0 7px ${colorValue(glowColor, '000001')}, 0 0 14px ${colorValue(glowColor, '000001')}` : 'none' }
    : mode === 'namewave'
      ? {
          '--bds-namewave-gradient': `linear-gradient(${Number(waveRotation) || 0}deg, ${waveColors.map(gradientCssColor).join(', ')})`,
          '--bds-namewave-speed': waveAnimation.seconds ? `${waveAnimation.seconds}s` : '0s',
          '--bds-namewave-shift': `${Number(waveShift) || 0}%`,
          '--bds-namewave-glow': waveGlowEnabled ? colorValue(waveGlowColor, '590539') : 'transparent',
        }
      : undefined

  const updateWaveColor = (index, value) => setWaveColors((current) => current.map((color, i) => i === index ? value : color))
  const addWaveColor = () => setWaveColors((current) => current.length >= 15 ? current : [...current, 'FFFFFF'])
  const removeWaveColor = (index) => setWaveColors((current) => current.length <= 2 ? current : current.filter((_, i) => i !== index))
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section className="bds-gradients-tool">
      <div className="bds-gradients-tool__tabs" role="tablist" aria-label="Opções do Gerador de Cores">
        {MODES.map((item) => {
          const Icon = item.icon
          return <button aria-selected={mode === item.id} className={mode === item.id ? 'is-active' : ''} key={item.id} onClick={() => setMode(item.id)} role="tab" type="button"><Icon size={16} aria-hidden="true" />{item.label}</button>
        })}
      </div>

      <div className="bds-gradients-tool__grid">
        <div className="bds-gradients-tool__controls">
          <label className="bds-gradients-tool__field"><span>Texto do preview</span><input maxLength={60} onChange={(event) => setText(event.target.value)} placeholder="Digite um nome ou texto" type="text" value={text} /></label>

          {mode === 'namecolor' ? (
            <section className="bds-gradients-tool__settings">
              <div className="bds-gradients-tool__setting-title"><strong>Namecolor</strong><small>Cor do texto</small></div>
              <label className="bds-gradients-tool__color-field"><input aria-label="Selecionar Namecolor" type="color" value={colorValue(nameColor, 'FF0000')} onChange={(event) => setNameColor(event.target.value.slice(1).toUpperCase())} /><span>#</span><input aria-label="Código hexadecimal do Namecolor" maxLength={6} value={nameColor} onChange={(event) => setNameColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label>
              <div className="bds-gradients-tool__setting-title bds-gradients-tool__setting-title--row"><div><strong>Nameglow</strong><small>{glowEnabled ? 'Ativado' : 'Sem brilho'}</small></div><label className="bds-gradients-tool__switch"><input checked={glowEnabled} onChange={(event) => setGlowEnabled(event.target.checked)} type="checkbox" /><span aria-hidden="true" /></label></div>
              {glowEnabled ? <label className="bds-gradients-tool__color-field"><input aria-label="Selecionar Nameglow" type="color" value={colorValue(glowColor, '000001')} onChange={(event) => setGlowColor(event.target.value.slice(1).toUpperCase())} /><span>#</span><input aria-label="Código hexadecimal do Nameglow" maxLength={6} value={glowColor} onChange={(event) => setGlowColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label> : null}
            </section>
          ) : mode === 'namewave' ? (
            <section className="bds-gradients-tool__settings bds-gradients-tool__settings--compact">
              <div className="bds-gradients-tool__compact-row">
                <span className="bds-gradients-tool__compact-label">Cores</span>
                <div className="bds-gradients-tool__color-dots">
                  {waveColors.map((color, index) => (
                    <div className="bds-gradients-tool__color-dot-wrap" key={`${index}-${color}`}>
                      <input aria-label={`Cor ${index + 1}`} className="bds-gradients-tool__color-dot" type="color" value={gradientCssColor(color)} onChange={(event) => updateWaveColor(index, event.target.value.slice(1).toUpperCase())} />
                      <button aria-label={`Remover cor ${index + 1}`} className="bds-gradients-tool__dot-remove" disabled={waveColors.length <= 2} onClick={() => removeWaveColor(index)} type="button"><Trash2 size={10} /></button>
                    </div>
                  ))}
                  <button aria-label="Adicionar cor" className="bds-gradients-tool__dot-add" disabled={waveColors.length >= 15} onClick={addWaveColor} type="button"><Plus size={18} /></button>
                </div>
              </div>

              <div className="bds-gradients-tool__compact-row">
                <span className="bds-gradients-tool__compact-label">Nameglow</span>
                <label className="bds-gradients-tool__switch"><input checked={waveGlowEnabled} onChange={(event) => setWaveGlowEnabled(event.target.checked)} type="checkbox" /><span aria-hidden="true" /></label>
                {waveGlowEnabled ? <label className="bds-gradients-tool__mini-color"><input aria-label="Cor do Nameglow" type="color" value={colorValue(waveGlowColor, '590539')} onChange={(event) => setWaveGlowColor(event.target.value.slice(1).toUpperCase())} /><input aria-label="HEX do Nameglow" maxLength={6} value={waveGlowColor} onChange={(event) => setWaveGlowColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label> : <small>0</small>}
              </div>

              <div className="bds-gradients-tool__compact-controls">
                <label><span>Velocidade</span><select value={waveSpeed} onChange={(event) => setWaveSpeed(event.target.value)}>{WAVE_SPEEDS.map((speed) => <option key={speed.id} value={speed.id}>{speed.label} · {speed.id === 'default' ? 'o1' : speed.code}</option>)}</select></label>
                <label><span>Rotação</span><div className="bds-gradients-tool__number"><input max="360" min="0" onChange={(event) => setWaveRotation(event.target.value)} type="number" value={waveRotation} /><em>°</em></div></label>
                <label><span>Deslocamento</span><div className="bds-gradients-tool__number"><input max="99" min="-99" onChange={(event) => setWaveShift(event.target.value)} type="number" value={waveShift} /><em>s</em></div></label>
              </div>

              <div className="bds-gradients-tool__color-codes">
                {waveColors.map((color, index) => <label key={`hex-${index}`}><span>{index + 1}</span><input aria-label={`HEX da cor ${index + 1}`} maxLength={6} value={color} onChange={(event) => updateWaveColor(index, event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label>)}
              </div>
            </section>
          ) : <div className="bds-gradients-tool__placeholder"><strong>Configurações de Nameflag</strong><p>Os controles específicos deste gerador serão adicionados na próxima etapa.</p></div>}
        </div>

        <div className="bds-gradients-tool__preview-column">
          <section className="bds-gradients-tool__preview" aria-label="Preview"><span>Preview</span><div className={mode === 'namewave' ? `bds-gradients-tool__namewave-preview ${waveSpeed === 'o0' ? 'is-static' : ''}` : ''} style={previewStyle}>{text || 'Seu texto'}</div></section>
          <section className="bds-gradients-tool__code" aria-label="Código gerado"><div className="bds-gradients-tool__code-header"><span>Código gerado</span><button onClick={handleCopy} type="button"><Clipboard size={15} aria-hidden="true" />{copied ? 'Copiado' : 'Copiar'}</button></div><code>{generatedCode}</code></section>
        </div>
      </div>
    </section>
  )
}
