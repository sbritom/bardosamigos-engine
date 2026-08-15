import { Clipboard, Flag, Sparkles, Waves } from 'lucide-react'
import { useMemo, useState } from 'react'
import './gradientsTool.css'

const MODES = [
  { id: 'namecolor', label: 'Namecolor', icon: Sparkles },
  { id: 'namewave', label: 'Namewave', icon: Waves },
  { id: 'nameflag', label: 'Nameflag', icon: Flag },
]

function normalizeHex(value, fallback) {
  const cleaned = String(value || '').replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase()
  return cleaned || fallback
}

function colorValue(value, fallback) {
  const normalized = normalizeHex(value, fallback)
  return `#${normalized.padEnd(6, '0').slice(0, 6)}`
}

export default function GradientsTool() {
  const [mode, setMode] = useState('namecolor')
  const [text, setText] = useState('BarDosAmigos')
  const [nameColor, setNameColor] = useState('FF0000')
  const [glowEnabled, setGlowEnabled] = useState(false)
  const [glowColor, setGlowColor] = useState('000001')
  const [copied, setCopied] = useState(false)

  const generatedCode = useMemo(() => {
    if (mode === 'namecolor') {
      return `(glow#${glowEnabled ? normalizeHex(glowColor, '000001') : '0'}#${normalizeHex(nameColor, 'FF0000')})`
    }
    if (mode === 'namewave') return 'Código do Namewave será gerado aqui.'
    return 'Código do Nameflag será gerado aqui.'
  }, [glowColor, glowEnabled, mode, nameColor])

  const previewStyle = mode === 'namecolor'
    ? {
        color: colorValue(nameColor, 'FF0000'),
        textShadow: glowEnabled
          ? `0 0 7px ${colorValue(glowColor, '000001')}, 0 0 14px ${colorValue(glowColor, '000001')}`
          : 'none',
      }
    : undefined

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
              <div className="bds-gradients-tool__setting-title">
                <strong>Namecolor</strong>
                <small>Escolha a cor do texto.</small>
              </div>

              <label className="bds-gradients-tool__color-field">
                <input aria-label="Selecionar Namecolor" type="color" value={colorValue(nameColor, 'FF0000')} onChange={(event) => setNameColor(event.target.value.slice(1).toUpperCase())} />
                <span>#</span>
                <input aria-label="Código hexadecimal do Namecolor" maxLength={6} value={nameColor} onChange={(event) => setNameColor(event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase())} />
              </label>

              <div className="bds-gradients-tool__setting-title bds-gradients-tool__setting-title--row">
                <div>
                  <strong>Nameglow</strong>
                  <small>{glowEnabled ? 'Glow aplicado ao redor do nome.' : 'Sem glow visual: o código usa 0.'}</small>
                </div>
                <label className="bds-gradients-tool__switch">
                  <input checked={glowEnabled} onChange={(event) => setGlowEnabled(event.target.checked)} type="checkbox" />
                  <span aria-hidden="true" />
                </label>
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
          ) : (
            <div className="bds-gradients-tool__placeholder">
              <strong>Configurações de {MODES.find((item) => item.id === mode)?.label}</strong>
              <p>Os controles específicos deste gerador serão adicionados na próxima etapa.</p>
            </div>
          )}
        </div>

        <div className="bds-gradients-tool__preview-column">
          <section className="bds-gradients-tool__preview" aria-label="Preview">
            <span>Preview</span>
            <div style={previewStyle}>{text || 'Seu texto'}</div>
          </section>

          <section className="bds-gradients-tool__code" aria-label="Código gerado">
            <div className="bds-gradients-tool__code-header">
              <span>Código gerado</span>
              <button onClick={handleCopy} type="button">
                <Clipboard size={15} aria-hidden="true" />
                {copied ? 'Copiado' : 'Copiar código'}
              </button>
            </div>
            <code>{generatedCode}</code>
          </section>
        </div>
      </div>
    </section>
  )
}
