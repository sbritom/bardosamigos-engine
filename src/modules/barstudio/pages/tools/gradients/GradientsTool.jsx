import { ArrowDown, ArrowUp, Clipboard, Flag, Plus, Sparkles, Trash2, Waves } from 'lucide-react'
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
  { id: 'o0', label: 'Sem animação', code: 'o0', seconds: 0 },
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
    if (mode === 'namecolor') {
      return `(glow#${glowEnabled ? normalizeHex(glowColor, '000001') : '0'}#${normalizeHex(nameColor, 'FF0000')})`
    }

    if (mode === 'namewave') {
      const glow = waveGlowEnabled ? normalizeHex(waveGlowColor, '590539') : '0'
      const colors = waveColors.slice(0, 15).map((color) => normalizeGradientColor(color)).join('#')
      const rotation = Number(waveRotation) ? `#r${Math.max(0, Math.min(360, Number(waveRotation)))}` : ''
      const shift = Number(waveShift) ? `#s${Math.max(-99, Math.min(99, Number(waveShift)))}` : ''
      const speed = WAVE_SPEEDS.find((item) => item.id === waveSpeed)?.code
      const speedCode = speed ? `#${speed}` : ''
      return `(glow#${glow}#grad#${colors}${rotation}${shift}${speedCode})`
    }

    return 'Código do Nameflag será gerado aqui.'
  }, [glowColor, glowEnabled, mode, nameColor, waveColors, waveGlowColor, waveGlowEnabled, waveRotation, waveShift, waveSpeed])

  const waveAnimation = WAVE_SPEEDS.find((item) => item.id === waveSpeed) || WAVE_SPEEDS[0]

  const previewStyle = mode === 'namecolor'
    ? {
        color: colorValue(nameColor, 'FF0000'),
        textShadow: glowEnabled
          ? `0 0 7px ${colorValue(glowColor, '000001')}, 0 0 14px ${colorValue(glowColor, '000001')}`
          : 'none',
      }
    : mode === 'namewave'
      ? {
          '--bds-namewave-gradient': `linear-gradient(${Number(waveRotation) || 0}deg, ${waveColors.map(gradientCssColor).join(', ')})`,
          '--bds-namewave-speed': waveAnimation.seconds ? `${waveAnimation.seconds}s` : '0s',
          '--bds-namewave-shift': `${Number(waveShift) || 0}%`,
          '--bds-namewave-glow': waveGlowEnabled ? colorValue(waveGlowColor, '590539') : 'transparent',
        }
      : undefined

  const updateWaveColor = (index, value) => {
    setWaveColors((current) => current.map((color, colorIndex) => colorIndex === index ? value : color))
  }

  const addWaveColor = () => {
    setWaveColors((current) => current.length >= 15 ? current : [...current, 'FFFFFF'])
  }

  const removeWaveColor = (index) => {
    setWaveColors((current) => current.length <= 2 ? current : current.filter((_, colorIndex) => colorIndex !== index))
  }

  const moveWaveColor = (index, direction) => {
    setWaveColors((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

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
          return (
            <button aria-selected={mode === item.id} className={mode === item.id ? 'is-active' : ''} key={item.id} onClick={() => setMode(item.id)} role="tab" type="button">
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="bds-gradients-tool__grid">
        <div className="bds-gradients-tool__controls">
          <label className="bds-gradients-tool__field">
            <span>Texto do preview</span>
            <input maxLength={60} onChange={(event) => setText(event.target.value)} placeholder="Digite um nome ou texto" type="text" value={text} />
          </label>

          {mode === 'namecolor' ? (
            <section className="bds-gradients-tool__settings">
              <div className="bds-gradients-tool__setting-title"><strong>Namecolor</strong><small>Escolha a cor do texto.</small></div>
              <label className="bds-gradients-tool__color-field">
                <input aria-label="Selecionar Namecolor" type="color" value={colorValue(nameColor, 'FF0000')} onChange={(event) => setNameColor(event.target.value.slice(1).toUpperCase())} />
                <span>#</span>
                <input aria-label="Código hexadecimal do Namecolor" maxLength={6} value={nameColor} onChange={(event) => setNameColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
              </label>
              <div className="bds-gradients-tool__setting-title bds-gradients-tool__setting-title--row">
                <div><strong>Nameglow</strong><small>{glowEnabled ? 'Glow aplicado ao redor do nome.' : 'Sem glow visual: o código usa 0.'}</small></div>
                <label className="bds-gradients-tool__switch"><input checked={glowEnabled} onChange={(event) => setGlowEnabled(event.target.checked)} type="checkbox" /><span aria-hidden="true" /></label>
              </div>
              {glowEnabled ? (
                <label className="bds-gradients-tool__color-field">
                  <input aria-label="Selecionar Nameglow" type="color" value={colorValue(glowColor, '000001')} onChange={(event) => setGlowColor(event.target.value.slice(1).toUpperCase())} />
                  <span>#</span>
                  <input aria-label="Código hexadecimal do Nameglow" maxLength={6} value={glowColor} onChange={(event) => setGlowColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
                </label>
              ) : null}
              <p className="bds-gradients-tool__hint">O Namecolor usa a sintaxe (glow#Nameglow#Namecolor). Quando você não quiser brilho, usamos 0 no Nameglow.</p>
            </section>
          ) : mode === 'namewave' ? (
            <section className="bds-gradients-tool__settings">
              <div className="bds-gradients-tool__setting-title bds-gradients-tool__setting-title--row">
                <div><strong>Nameglow</strong><small>O Namewave usa Namegrad + Namecolor + Nameglow.</small></div>
                <label className="bds-gradients-tool__switch"><input checked={waveGlowEnabled} onChange={(event) => setWaveGlowEnabled(event.target.checked)} type="checkbox" /><span aria-hidden="true" /></label>
              </div>
              {waveGlowEnabled ? (
                <label className="bds-gradients-tool__color-field">
                  <input aria-label="Selecionar glow do Namewave" type="color" value={colorValue(waveGlowColor, '590539')} onChange={(event) => setWaveGlowColor(event.target.value.slice(1).toUpperCase())} />
                  <span>#</span>
                  <input aria-label="Código do glow do Namewave" maxLength={6} value={waveGlowColor} onChange={(event) => setWaveGlowColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
                </label>
              ) : null}

              <div className="bds-gradients-tool__setting-title"><strong>Cores do Namegrad</strong><small>Use de 2 a 15 cores. Você pode adicionar, remover e mudar a ordem.</small></div>
              <div className="bds-gradients-tool__color-list">
                {waveColors.map((color, index) => (
                  <div className="bds-gradients-tool__color-row" key={`${index}-${color}`}>
                    <input aria-label={`Selecionar cor ${index + 1}`} type="color" value={gradientCssColor(color)} onChange={(event) => updateWaveColor(index, event.target.value.slice(1).toUpperCase())} />
                    <span>#</span>
                    <input aria-label={`Código da cor ${index + 1}`} maxLength={6} value={color} onChange={(event) => updateWaveColor(index, event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
                    <button aria-label="Mover cor para cima" disabled={index === 0} onClick={() => moveWaveColor(index, -1)} type="button"><ArrowUp size={15} /></button>
                    <button aria-label="Mover cor para baixo" disabled={index === waveColors.length - 1} onClick={() => moveWaveColor(index, 1)} type="button"><ArrowDown size={15} /></button>
                    <button aria-label="Remover cor" disabled={waveColors.length <= 2} onClick={() => removeWaveColor(index)} type="button"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <button className="bds-gradients-tool__add-color" disabled={waveColors.length >= 15} onClick={addWaveColor} type="button"><Plus size={16} />Adicionar cor {waveColors.length}/15</button>

              <div className="bds-gradients-tool__wave-options">
                <label><span>Rotação</span><input max="360" min="0" onChange={(event) => setWaveRotation(event.target.value)} type="number" value={waveRotation} /><small>Gera r{Number(waveRotation) || 0}. Ex.: r90 = vertical.</small></label>
                <label><span>Deslocamento</span><input max="99" min="-99" onChange={(event) => setWaveShift(event.target.value)} type="number" value={waveShift} /><small>Gera sN. Use 0 para não adicionar.</small></label>
              </div>

              <div className="bds-gradients-tool__setting-title"><strong>Velocidade do Namewave</strong><small>O padrão corresponde a o1 e não precisa ser incluído no código.</small></div>
              <div className="bds-gradients-tool__speed-grid">
                {WAVE_SPEEDS.map((speed) => <button className={waveSpeed === speed.id ? 'is-active' : ''} key={speed.id} onClick={() => setWaveSpeed(speed.id)} type="button">{speed.label}<small>{speed.id === 'default' ? 'o1' : speed.code}</small></button>)}
              </div>
              <p className="bds-gradients-tool__hint">Namegrad exige pelo menos duas cores. O preview é uma aproximação visual no navegador; o código gerado segue a estrutura documentada pelo xat.</p>
            </section>
          ) : (
            <div className="bds-gradients-tool__placeholder"><strong>Configurações de Nameflag</strong><p>Os controles específicos deste gerador serão adicionados na próxima etapa.</p></div>
          )}
        </div>

        <div className="bds-gradients-tool__preview-column">
          <section className="bds-gradients-tool__preview" aria-label="Preview">
            <span>Preview</span>
            <div className={mode === 'namewave' ? `bds-gradients-tool__namewave-preview ${waveSpeed === 'o0' ? 'is-static' : ''}` : ''} style={previewStyle}>{text || 'Seu texto'}</div>
          </section>
          <section className="bds-gradients-tool__code" aria-label="Código gerado">
            <div className="bds-gradients-tool__code-header"><span>Código gerado</span><button onClick={handleCopy} type="button"><Clipboard size={15} aria-hidden="true" />{copied ? 'Copiado' : 'Copiar código'}</button></div>
            <code>{generatedCode}</code>
          </section>
        </div>
      </div>
    </section>
  )
}
