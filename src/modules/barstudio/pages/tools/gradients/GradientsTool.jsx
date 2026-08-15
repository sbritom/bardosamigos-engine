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

const FLAG_SPEEDS = [
  { id: 'default', label: 'Padrão', code: '', seconds: 3 },
  { id: 'f1', label: 'f1', code: 'f1', seconds: 5.4 },
  { id: 'f2', label: 'f2', code: 'f2', seconds: 4.1 },
  { id: 'f3', label: 'f3', code: 'f3', seconds: 2.8 },
  { id: 'f4', label: 'f4', code: 'f4', seconds: 1.8 },
]

const FLAG_OPTIONS = [
  ['br', '🇧🇷', 'Brasil'], ['us', '🇺🇸', 'Estados Unidos'], ['pt', '🇵🇹', 'Portugal'], ['ca', '🇨🇦', 'Canadá'],
  ['tr', '🇹🇷', 'Turquia'], ['es', '🇪🇸', 'Espanha'], ['ar', '🇦🇷', 'Argentina'], ['mx', '🇲🇽', 'México'],
  ['gb', '🇬🇧', 'Reino Unido'], ['fr', '🇫🇷', 'França'], ['de', '🇩🇪', 'Alemanha'], ['it', '🇮🇹', 'Itália'],
  ['cq', '🏳️', 'CQ'], ['so', '🏳️', 'SO'], ['guernsey', '🏳️', 'Guernsey'], ['redcross', '✚', 'Redcross'],
  ['paw', '🐾', 'Paw'], ['jr', '🏳️', 'JR'], ['al', '🇦🇱', 'AL'], ['aland', '🏳️', 'Aland'], ['ye', '🇾🇪', 'YE'], ['bf', '🇧🇫', 'BF'],
  ['jewel', '💎', 'Jewel'],
]

const DEFAULT_WAVE_COLORS = ['F45', 'FFBAED', 'E854AF']
const cleanHex = (value, fallback) => String(value || '').replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase() || fallback
const cssColor = (value, fallback) => {
  const normalized = cleanHex(value, fallback)
  return `#${normalized.length === 3 ? normalized : normalized.padEnd(6, '0').slice(0, 6)}`
}
const gradColor = (value) => cssColor(value, 'FFFFFF')
const splitExtraCodes = (value) => String(value || '')
  .split(/[\s,#]+/)
  .map((item) => item.trim().replace(/^#/, ''))
  .filter(Boolean)

export default function GradientsTool() {
  const [mode, setMode] = useState('namecolor')
  const [text, setText] = useState('BarDosAmigos')
  const [copied, setCopied] = useState(false)

  const [nameColor, setNameColor] = useState('FF0000')
  const [glowEnabled, setGlowEnabled] = useState(false)
  const [glowColor, setGlowColor] = useState('000001')

  const [waveGlowEnabled, setWaveGlowEnabled] = useState(true)
  const [waveGlowColor, setWaveGlowColor] = useState('590539')
  const [waveColors, setWaveColors] = useState(DEFAULT_WAVE_COLORS)
  const [waveRotation, setWaveRotation] = useState(45)
  const [waveShift, setWaveShift] = useState(0)
  const [waveSpeed, setWaveSpeed] = useState('default')

  const [flagCode, setFlagCode] = useState('br')
  const [flagGlow, setFlagGlow] = useState('000001')
  const [flagGlowEnabled, setFlagGlowEnabled] = useState(true)
  const [flagMotion, setFlagMotion] = useState('wave')
  const [flagReverse, setFlagReverse] = useState(false)
  const [flagSpeed, setFlagSpeed] = useState('default')
  const [flagGrowth, setFlagGrowth] = useState('default')
  const [flagCycle, setFlagCycle] = useState('default')
  const [flagExtraCodes, setFlagExtraCodes] = useState('')
  const [jewelColor, setJewelColor] = useState('DC143C')

  const generatedCode = useMemo(() => {
    if (mode === 'namecolor') {
      return `(glow#${glowEnabled ? cleanHex(glowColor, '000001') : '0'}#${cleanHex(nameColor, 'FF0000')})`
    }

    if (mode === 'namewave') {
      const glow = waveGlowEnabled ? cleanHex(waveGlowColor, '590539') : '0'
      const colors = waveColors.slice(0, 15).map((color) => cleanHex(color, 'FFFFFF')).join('#')
      const rotation = Number(waveRotation) ? `#r${Math.max(0, Math.min(360, Number(waveRotation)))}` : ''
      const shift = Number(waveShift) ? `#s${Math.max(-99, Math.min(99, Number(waveShift)))}` : ''
      const speed = WAVE_SPEEDS.find((item) => item.id === waveSpeed)?.code
      return `(glow#${glow}#grad#${colors}${rotation}${shift}${speed ? `#${speed}` : ''})`
    }

    const extras = []
    if (flagCode === 'jewel') extras.push(cleanHex(jewelColor, 'DC143C'))
    if (flagMotion !== 'wave') extras.push(flagMotion)
    if (flagReverse) extras.push('d')
    const speed = FLAG_SPEEDS.find((item) => item.id === flagSpeed)?.code
    if (speed) extras.push(speed)
    if (flagGrowth !== 'default') extras.push(flagGrowth)
    if (flagCycle !== 'default') extras.push(flagCycle)
    extras.push(...splitExtraCodes(flagExtraCodes))

    return `(glow#${flagGlowEnabled ? cleanHex(flagGlow, '000001') : '0'}#flag#${flagCode}${extras.map((item) => `#${item}`).join('')})`
  }, [
    mode, glowEnabled, glowColor, nameColor,
    waveGlowEnabled, waveGlowColor, waveColors, waveRotation, waveShift, waveSpeed,
    flagCode, flagGlow, flagGlowEnabled, flagMotion, flagReverse, flagSpeed, flagGrowth, flagCycle, flagExtraCodes, jewelColor,
  ])

  const waveAnimation = WAVE_SPEEDS.find((item) => item.id === waveSpeed) || WAVE_SPEEDS[0]
  const selectedFlag = FLAG_OPTIONS.find((item) => item[0] === flagCode) || FLAG_OPTIONS[0]

  const previewStyle = mode === 'namecolor'
    ? {
        color: cssColor(nameColor, 'FF0000'),
        textShadow: glowEnabled ? `0 0 7px ${cssColor(glowColor, '000001')}, 0 0 14px ${cssColor(glowColor, '000001')}` : 'none',
      }
    : mode === 'namewave'
      ? {
          '--bds-namewave-gradient': `linear-gradient(${Number(waveRotation) || 0}deg, ${waveColors.map(gradColor).join(', ')})`,
          '--bds-namewave-speed': waveAnimation.seconds ? `${waveAnimation.seconds}s` : '0s',
          '--bds-namewave-shift': `${Number(waveShift) || 0}%`,
          '--bds-namewave-glow': waveGlowEnabled ? cssColor(waveGlowColor, '590539') : 'transparent',
        }
      : undefined

  const flagPreviewStyle = flagCode === 'jewel'
    ? {
        color: cssColor(jewelColor, 'DC143C'),
        WebkitTextFillColor: cssColor(jewelColor, 'DC143C'),
        textShadow: flagGlowEnabled ? `0 0 8px ${cssColor(flagGlow, '000001')}, 0 0 14px ${cssColor(flagGlow, '000001')}` : 'none',
      }
    : {
        textShadow: flagGlowEnabled ? `0 0 8px ${cssColor(flagGlow, '000001')}` : 'none',
      }

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
      <div className="bds-gradients-tool__tabs">
        {MODES.map((item) => {
          const Icon = item.icon
          return (
            <button className={mode === item.id ? 'is-active' : ''} key={item.id} onClick={() => setMode(item.id)} type="button">
              <Icon size={16} />{item.label}
            </button>
          )
        })}
      </div>

      <div className="bds-gradients-tool__grid">
        <div className="bds-gradients-tool__controls">
          <label className="bds-gradients-tool__field">
            <span>Texto do preview</span>
            <input maxLength={60} onChange={(event) => setText(event.target.value)} value={text} />
          </label>

          {mode === 'namecolor' ? (
            <section className="bds-gradients-tool__settings">
              <div className="bds-gradients-tool__setting-title"><strong>Namecolor</strong><small>Cor do texto</small></div>
              <label className="bds-gradients-tool__color-field">
                <input type="color" value={cssColor(nameColor, 'FF0000')} onChange={(event) => setNameColor(event.target.value.slice(1).toUpperCase())} />
                <span>#</span>
                <input maxLength={6} value={nameColor} onChange={(event) => setNameColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
              </label>
              <div className="bds-gradients-tool__setting-title bds-gradients-tool__setting-title--row">
                <div><strong>Nameglow</strong><small>{glowEnabled ? 'Ativado' : 'Sem brilho'}</small></div>
                <label className="bds-gradients-tool__switch"><input checked={glowEnabled} onChange={(event) => setGlowEnabled(event.target.checked)} type="checkbox" /><span /></label>
              </div>
              {glowEnabled ? (
                <label className="bds-gradients-tool__color-field">
                  <input type="color" value={cssColor(glowColor, '000001')} onChange={(event) => setGlowColor(event.target.value.slice(1).toUpperCase())} />
                  <span>#</span>
                  <input maxLength={6} value={glowColor} onChange={(event) => setGlowColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
                </label>
              ) : null}
            </section>
          ) : mode === 'namewave' ? (
            <section className="bds-gradients-tool__settings bds-gradients-tool__settings--compact">
              <div className="bds-gradients-tool__compact-row">
                <span className="bds-gradients-tool__compact-label">Cores</span>
                <div className="bds-gradients-tool__color-dots">
                  {waveColors.map((color, index) => (
                    <div className="bds-gradients-tool__color-dot-wrap" key={index}>
                      <input className="bds-gradients-tool__color-dot" type="color" value={gradColor(color)} onChange={(event) => updateWaveColor(index, event.target.value.slice(1).toUpperCase())} />
                      <button className="bds-gradients-tool__dot-remove" disabled={waveColors.length <= 2} onClick={() => removeWaveColor(index)} type="button"><Trash2 size={10} /></button>
                    </div>
                  ))}
                  <button className="bds-gradients-tool__dot-add" disabled={waveColors.length >= 15} onClick={addWaveColor} type="button"><Plus size={18} /></button>
                </div>
              </div>
              <div className="bds-gradients-tool__compact-row">
                <span className="bds-gradients-tool__compact-label">Nameglow</span>
                <label className="bds-gradients-tool__switch"><input checked={waveGlowEnabled} onChange={(event) => setWaveGlowEnabled(event.target.checked)} type="checkbox" /><span /></label>
                {waveGlowEnabled ? (
                  <label className="bds-gradients-tool__mini-color">
                    <input type="color" value={cssColor(waveGlowColor, '590539')} onChange={(event) => setWaveGlowColor(event.target.value.slice(1).toUpperCase())} />
                    <input maxLength={6} value={waveGlowColor} onChange={(event) => setWaveGlowColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
                  </label>
                ) : <small>0</small>}
              </div>
              <div className="bds-gradients-tool__compact-controls">
                <label><span>Velocidade</span><select value={waveSpeed} onChange={(event) => setWaveSpeed(event.target.value)}>{WAVE_SPEEDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                <label><span>Rotação</span><div className="bds-gradients-tool__number"><input max="360" min="0" type="number" value={waveRotation} onChange={(event) => setWaveRotation(event.target.value)} /><em>°</em></div></label>
                <label><span>Deslocamento</span><div className="bds-gradients-tool__number"><input max="99" min="-99" type="number" value={waveShift} onChange={(event) => setWaveShift(event.target.value)} /><em>s</em></div></label>
              </div>
              <div className="bds-gradients-tool__color-codes">
                {waveColors.map((color, index) => <label key={index}><span>{index + 1}</span><input maxLength={6} value={color} onChange={(event) => updateWaveColor(index, event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label>)}
              </div>
            </section>
          ) : (
            <section className="bds-gradients-tool__settings bds-gradients-tool__settings--compact">
              <div className="bds-gradients-tool__compact-row">
                <span className="bds-gradients-tool__compact-label">Bandeira</span>
                <select className="bds-gradients-tool__flag-select" value={flagCode} onChange={(event) => setFlagCode(event.target.value)}>
                  {FLAG_OPTIONS.map((flag) => <option key={flag[0]} value={flag[0]}>{flag[1]} {flag[2]}</option>)}
                </select>
              </div>

              {flagCode === 'jewel' ? (
                <div className="bds-gradients-tool__compact-row">
                  <span className="bds-gradients-tool__compact-label">Cor Jewel</span>
                  <label className="bds-gradients-tool__mini-color">
                    <input type="color" value={cssColor(jewelColor, 'DC143C')} onChange={(event) => setJewelColor(event.target.value.slice(1).toUpperCase())} />
                    <input maxLength={6} value={jewelColor} onChange={(event) => setJewelColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
                  </label>
                </div>
              ) : null}

              <div className="bds-gradients-tool__compact-row">
                <span className="bds-gradients-tool__compact-label">Nameglow</span>
                <label className="bds-gradients-tool__switch"><input checked={flagGlowEnabled} onChange={(event) => setFlagGlowEnabled(event.target.checked)} type="checkbox" /><span /></label>
                {flagGlowEnabled ? (
                  <label className="bds-gradients-tool__mini-color">
                    <input type="color" value={cssColor(flagGlow, '000001')} onChange={(event) => setFlagGlow(event.target.value.slice(1).toUpperCase())} />
                    <input maxLength={6} value={flagGlow} onChange={(event) => setFlagGlow(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
                  </label>
                ) : <small>0</small>}
              </div>

              <div className="bds-gradients-tool__flag-options">
                <div><span>Movimento</span><div className="bds-gradients-tool__choice-row">{[['wave', 'Wave'], ['r', 'Rotate'], ['e', 'Expand'], ['u', 'Vertical']].map((item) => <button className={flagMotion === item[0] ? 'is-active' : ''} key={item[0]} onClick={() => setFlagMotion(item[0])} type="button">{item[1]}</button>)}</div></div>
                <div><span>Direção</span><label className="bds-gradients-tool__switch-line"><span>Inverter</span><label className="bds-gradients-tool__switch"><input checked={flagReverse} onChange={(event) => setFlagReverse(event.target.checked)} type="checkbox" /><span /></label></label></div>
                <div><span>Velocidade</span><div className="bds-gradients-tool__choice-row">{FLAG_SPEEDS.map((item) => <button className={flagSpeed === item.id ? 'is-active' : ''} key={item.id} onClick={() => setFlagSpeed(item.id)} type="button">{item.label}</button>)}</div></div>
                <div><span>Crescimento</span><div className="bds-gradients-tool__choice-row">{['default', 'g1', 'g2', 'g3', 'g4'].map((item) => <button className={flagGrowth === item ? 'is-active' : ''} key={item} onClick={() => setFlagGrowth(item)} type="button">{item === 'default' ? 'Padrão' : item}</button>)}</div></div>
                <div><span>Ciclo</span><div className="bds-gradients-tool__choice-row">{['default', 'c1', 'c3', 'c4'].map((item) => <button className={flagCycle === item ? 'is-active' : ''} key={item} onClick={() => setFlagCycle(item)} type="button">{item === 'default' ? 'Padrão' : item}</button>)}</div></div>
              </div>

              <label className="bds-gradients-tool__field bds-gradients-tool__field--embedded">
                <span>Códigos extras</span>
                <input placeholder="Ex.: rbr 13 x s3 10 cx ff0000" value={flagExtraCodes} onChange={(event) => setFlagExtraCodes(event.target.value)} />
              </label>
            </section>
          )}
        </div>

        <div className="bds-gradients-tool__preview-column">
          <section className="bds-gradients-tool__preview">
            <span>Preview</span>
            {mode === 'nameflag' ? (
              <div className={`bds-gradients-tool__flag-preview motion-${flagMotion} ${flagReverse ? 'is-reverse' : ''}`} style={flagPreviewStyle} title={`${selectedFlag[1]} ${selectedFlag[2]}`}>{text || 'Seu texto'}</div>
            ) : (
              <div className={mode === 'namewave' ? `bds-gradients-tool__namewave-preview ${waveSpeed === 'o0' ? 'is-static' : ''}` : ''} style={previewStyle}>{text || 'Seu texto'}</div>
            )}
          </section>

          <section className="bds-gradients-tool__code">
            <div className="bds-gradients-tool__code-header"><span>Código gerado</span><button onClick={handleCopy} type="button"><Clipboard size={15} />{copied ? 'Copiado' : 'Copiar'}</button></div>
            <code>{generatedCode}</code>
          </section>
        </div>
      </div>
    </section>
  )
}
