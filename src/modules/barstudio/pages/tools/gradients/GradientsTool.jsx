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

const FLAGS = [
  ['br', '🇧🇷', 'Brasil'], ['us', '🇺🇸', 'Estados Unidos'], ['pt', '🇵🇹', 'Portugal'], ['es', '🇪🇸', 'Espanha'],
  ['ar', '🇦🇷', 'Argentina'], ['mx', '🇲🇽', 'México'], ['gb', '🇬🇧', 'Reino Unido'], ['fr', '🇫🇷', 'França'],
  ['de', '🇩🇪', 'Alemanha'], ['it', '🇮🇹', 'Itália'], ['ca', '🇨🇦', 'Canadá'], ['jp', '🇯🇵', 'Japão'],
  ['au', '🇦🇺', 'Austrália'], ['at', '🇦🇹', 'Áustria'], ['be', '🇧🇪', 'Bélgica'], ['cl', '🇨🇱', 'Chile'],
  ['cn', '🇨🇳', 'China'], ['co', '🇨🇴', 'Colômbia'], ['cr', '🇨🇷', 'Costa Rica'], ['cu', '🇨🇺', 'Cuba'],
  ['dk', '🇩🇰', 'Dinamarca'], ['ec', '🇪🇨', 'Equador'], ['gr', '🇬🇷', 'Grécia'], ['ie', '🇮🇪', 'Irlanda'],
  ['in', '🇮🇳', 'Índia'], ['nl', '🇳🇱', 'Países Baixos'], ['no', '🇳🇴', 'Noruega'], ['nz', '🇳🇿', 'Nova Zelândia'],
  ['pe', '🇵🇪', 'Peru'], ['pl', '🇵🇱', 'Polônia'], ['pr', '🇵🇷', 'Porto Rico'], ['py', '🇵🇾', 'Paraguai'],
  ['ru', '🇷🇺', 'Rússia'], ['se', '🇸🇪', 'Suécia'], ['tr', '🇹🇷', 'Turquia'], ['uy', '🇺🇾', 'Uruguai'], ['ve', '🇻🇪', 'Venezuela'],
]

const DEFAULT_WAVE_COLORS = ['F45', 'FFBAED', 'E854AF']
const cleanHex = (value, fallback) => String(value || '').replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase() || fallback
const cssColor = (value, fallback) => { const n = cleanHex(value, fallback); return `#${n.length === 3 ? n : n.padEnd(6, '0').slice(0, 6)}` }
const gradColor = (value) => cssColor(value, 'FFFFFF')

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

  const generatedCode = useMemo(() => {
    if (mode === 'namecolor') return `(glow#${glowEnabled ? cleanHex(glowColor, '000001') : '0'}#${cleanHex(nameColor, 'FF0000')})`
    if (mode === 'namewave') {
      const glow = waveGlowEnabled ? cleanHex(waveGlowColor, '590539') : '0'
      const colors = waveColors.slice(0, 15).map((c) => cleanHex(c, 'FFFFFF')).join('#')
      const rotation = Number(waveRotation) ? `#r${Math.max(0, Math.min(360, Number(waveRotation)))}` : ''
      const shift = Number(waveShift) ? `#s${Math.max(-99, Math.min(99, Number(waveShift)))}` : ''
      const speed = WAVE_SPEEDS.find((x) => x.id === waveSpeed)?.code
      return `(glow#${glow}#grad#${colors}${rotation}${shift}${speed ? `#${speed}` : ''})`
    }
    const extras = []
    if (flagMotion !== 'wave') extras.push(flagMotion)
    if (flagReverse) extras.push('d')
    const speed = FLAG_SPEEDS.find((x) => x.id === flagSpeed)?.code
    if (speed) extras.push(speed)
    if (flagGrowth !== 'default') extras.push(flagGrowth)
    if (flagCycle !== 'default') extras.push(flagCycle)
    return `(glow#${flagGlowEnabled ? cleanHex(flagGlow, '000001') : '0'}#flag#${flagCode}${extras.map((x) => `#${x}`).join('')})`
  }, [mode, glowEnabled, glowColor, nameColor, waveGlowEnabled, waveGlowColor, waveColors, waveRotation, waveShift, waveSpeed, flagCode, flagGlow, flagGlowEnabled, flagMotion, flagReverse, flagSpeed, flagGrowth, flagCycle])

  const waveAnim = WAVE_SPEEDS.find((x) => x.id === waveSpeed) || WAVE_SPEEDS[0]
  const flagAnim = FLAG_SPEEDS.find((x) => x.id === flagSpeed) || FLAG_SPEEDS[0]
  const selectedFlag = FLAGS.find((x) => x[0] === flagCode) || FLAGS[0]

  const previewStyle = mode === 'namecolor'
    ? { color: cssColor(nameColor, 'FF0000'), textShadow: glowEnabled ? `0 0 7px ${cssColor(glowColor, '000001')}, 0 0 14px ${cssColor(glowColor, '000001')}` : 'none' }
    : mode === 'namewave'
      ? {
          '--bds-namewave-gradient': `linear-gradient(${Number(waveRotation) || 0}deg, ${waveColors.map(gradColor).join(', ')})`,
          '--bds-namewave-speed': waveAnim.seconds ? `${waveAnim.seconds}s` : '0s',
          '--bds-namewave-shift': `${Number(waveShift) || 0}%`,
          '--bds-namewave-glow': waveGlowEnabled ? cssColor(waveGlowColor, '590539') : 'transparent',
        }
      : undefined

  const flagStyle = {
    '--bds-nameflag-image': `url(https://flagcdn.com/w320/${flagCode}.png)`,
    '--bds-nameflag-speed': `${flagAnim.seconds}s`,
    '--bds-nameflag-glow': flagGlowEnabled ? cssColor(flagGlow, '000001') : 'transparent',
    '--bds-nameflag-growth': flagGrowth === 'g4' ? '1.20' : flagGrowth === 'g3' ? '1.13' : flagGrowth === 'g1' ? '1.06' : '1',
    '--bds-nameflag-cycle': flagCycle === 'c4' ? '1.85' : flagCycle === 'c3' ? '1.5' : flagCycle === 'c1' ? '1.18' : '1',
  }

  const updateWaveColor = (index, value) => setWaveColors((current) => current.map((c, i) => i === index ? value : c))
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
          return <button className={mode === item.id ? 'is-active' : ''} key={item.id} onClick={() => setMode(item.id)} type="button"><Icon size={16} />{item.label}</button>
        })}
      </div>

      <div className="bds-gradients-tool__grid">
        <div className="bds-gradients-tool__controls">
          <label className="bds-gradients-tool__field"><span>Texto do preview</span><input maxLength={60} onChange={(e) => setText(e.target.value)} value={text} /></label>

          {mode === 'namecolor' ? (
            <section className="bds-gradients-tool__settings">
              <div className="bds-gradients-tool__setting-title"><strong>Namecolor</strong><small>Cor do texto</small></div>
              <label className="bds-gradients-tool__color-field"><input type="color" value={cssColor(nameColor, 'FF0000')} onChange={(e) => setNameColor(e.target.value.slice(1).toUpperCase())} /><span>#</span><input maxLength={6} value={nameColor} onChange={(e) => setNameColor(e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label>
              <div className="bds-gradients-tool__setting-title bds-gradients-tool__setting-title--row"><div><strong>Nameglow</strong><small>{glowEnabled ? 'Ativado' : 'Sem brilho'}</small></div><label className="bds-gradients-tool__switch"><input checked={glowEnabled} onChange={(e) => setGlowEnabled(e.target.checked)} type="checkbox" /><span /></label></div>
              {glowEnabled ? <label className="bds-gradients-tool__color-field"><input type="color" value={cssColor(glowColor, '000001')} onChange={(e) => setGlowColor(e.target.value.slice(1).toUpperCase())} /><span>#</span><input maxLength={6} value={glowColor} onChange={(e) => setGlowColor(e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label> : null}
            </section>
          ) : mode === 'namewave' ? (
            <section className="bds-gradients-tool__settings bds-gradients-tool__settings--compact">
              <div className="bds-gradients-tool__compact-row"><span className="bds-gradients-tool__compact-label">Cores</span><div className="bds-gradients-tool__color-dots">{waveColors.map((c, i) => <div className="bds-gradients-tool__color-dot-wrap" key={i}><input className="bds-gradients-tool__color-dot" type="color" value={gradColor(c)} onChange={(e) => updateWaveColor(i, e.target.value.slice(1).toUpperCase())} /><button className="bds-gradients-tool__dot-remove" disabled={waveColors.length <= 2} onClick={() => removeWaveColor(i)} type="button"><Trash2 size={10} /></button></div>)}<button className="bds-gradients-tool__dot-add" disabled={waveColors.length >= 15} onClick={addWaveColor} type="button"><Plus size={18} /></button></div></div>
              <div className="bds-gradients-tool__compact-row"><span className="bds-gradients-tool__compact-label">Nameglow</span><label className="bds-gradients-tool__switch"><input checked={waveGlowEnabled} onChange={(e) => setWaveGlowEnabled(e.target.checked)} type="checkbox" /><span /></label>{waveGlowEnabled ? <label className="bds-gradients-tool__mini-color"><input type="color" value={cssColor(waveGlowColor, '590539')} onChange={(e) => setWaveGlowColor(e.target.value.slice(1).toUpperCase())} /><input maxLength={6} value={waveGlowColor} onChange={(e) => setWaveGlowColor(e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label> : <small>0</small>}</div>
              <div className="bds-gradients-tool__compact-controls"><label><span>Velocidade</span><select value={waveSpeed} onChange={(e) => setWaveSpeed(e.target.value)}>{WAVE_SPEEDS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label><label><span>Rotação</span><div className="bds-gradients-tool__number"><input max="360" min="0" type="number" value={waveRotation} onChange={(e) => setWaveRotation(e.target.value)} /><em>°</em></div></label><label><span>Deslocamento</span><div className="bds-gradients-tool__number"><input max="99" min="-99" type="number" value={waveShift} onChange={(e) => setWaveShift(e.target.value)} /><em>s</em></div></label></div>
              <div className="bds-gradients-tool__color-codes">{waveColors.map((c, i) => <label key={i}><span>{i + 1}</span><input maxLength={6} value={c} onChange={(e) => updateWaveColor(i, e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label>)}</div>
            </section>
          ) : (
            <section className="bds-gradients-tool__settings bds-gradients-tool__settings--compact">
              <div className="bds-gradients-tool__compact-row"><span className="bds-gradients-tool__compact-label">Bandeira</span><select className="bds-gradients-tool__flag-select" value={flagCode} onChange={(e) => setFlagCode(e.target.value)}>{FLAGS.map((f) => <option key={f[0]} value={f[0]}>{f[1]} {f[2]}</option>)}</select></div>
              <div className="bds-gradients-tool__compact-row"><span className="bds-gradients-tool__compact-label">Nameglow</span><label className="bds-gradients-tool__switch"><input checked={flagGlowEnabled} onChange={(e) => setFlagGlowEnabled(e.target.checked)} type="checkbox" /><span /></label>{flagGlowEnabled ? <label className="bds-gradients-tool__mini-color"><input type="color" value={cssColor(flagGlow, '000001')} onChange={(e) => setFlagGlow(e.target.value.slice(1).toUpperCase())} /><input maxLength={6} value={flagGlow} onChange={(e) => setFlagGlow(e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} /></label> : <small>0</small>}</div>
              <div className="bds-gradients-tool__flag-options">
                <div><span>Movimento</span><div className="bds-gradients-tool__choice-row">{[['wave', 'Wave'], ['r', 'Rotate'], ['e', 'Expand'], ['u', 'Vertical']].map((x) => <button className={flagMotion === x[0] ? 'is-active' : ''} key={x[0]} onClick={() => setFlagMotion(x[0])} type="button">{x[1]}</button>)}</div></div>
                <div><span>Direção</span><label className="bds-gradients-tool__switch-line"><span>Inverter</span><label className="bds-gradients-tool__switch"><input checked={flagReverse} onChange={(e) => setFlagReverse(e.target.checked)} type="checkbox" /><span /></label></label></div>
                <div><span>Velocidade</span><div className="bds-gradients-tool__choice-row">{FLAG_SPEEDS.map((x) => <button className={flagSpeed === x.id ? 'is-active' : ''} key={x.id} onClick={() => setFlagSpeed(x.id)} type="button">{x.label}</button>)}</div></div>
                <div><span>Crescimento</span><div className="bds-gradients-tool__choice-row">{['default', 'g1', 'g3', 'g4'].map((x) => <button className={flagGrowth === x ? 'is-active' : ''} key={x} onClick={() => setFlagGrowth(x)} type="button">{x === 'default' ? 'Padrão' : x}</button>)}</div></div>
                <div><span>Ciclo</span><div className="bds-gradients-tool__choice-row">{['default', 'c1', 'c3', 'c4'].map((x) => <button className={flagCycle === x ? 'is-active' : ''} key={x} onClick={() => setFlagCycle(x)} type="button">{x === 'default' ? 'Padrão' : x}</button>)}</div></div>
              </div>
            </section>
          )}
        </div>

        <div className="bds-gradients-tool__preview-column">
          <section className="bds-gradients-tool__preview"><span>Preview</span>{mode === 'nameflag' ? <div className={`bds-gradients-tool__flag-preview motion-${flagMotion} ${flagReverse ? 'is-reverse' : ''}`} style={flagStyle} title={`${selectedFlag[1]} ${selectedFlag[2]}`}>{text || 'Seu texto'}</div> : <div className={mode === 'namewave' ? `bds-gradients-tool__namewave-preview ${waveSpeed === 'o0' ? 'is-static' : ''}` : ''} style={previewStyle}>{text || 'Seu texto'}</div>}</section>
          <section className="bds-gradients-tool__code"><div className="bds-gradients-tool__code-header"><span>Código gerado</span><button onClick={handleCopy} type="button"><Clipboard size={15} />{copied ? 'Copiado' : 'Copiar'}</button></div><code>{generatedCode}</code></section>
        </div>
      </div>
    </section>
  )
}
