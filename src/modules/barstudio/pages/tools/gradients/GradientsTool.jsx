import { Clipboard, Flag, Sparkles, Waves, Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import './gradientsTool.css'

const MODES = [
  { id: 'gradient', label: 'Gradiente', icon: Wand2 },
  { id: 'namecolor', label: 'Namecolor', icon: Sparkles },
  { id: 'namewave', label: 'Namewave', icon: Waves },
  { id: 'nameflag', label: 'Nameflag', icon: Flag },
]

const PLACEHOLDERS = {
  gradient: 'Código do gradiente será gerado aqui.',
  namecolor: 'Código do Namecolor será gerado aqui.',
  namewave: 'Código do Namewave será gerado aqui.',
  nameflag: 'Código do Nameflag será gerado aqui.',
}

export default function GradientsTool() {
  const [mode, setMode] = useState('gradient')
  const [text, setText] = useState('BarDosAmigos')
  const [copied, setCopied] = useState(false)

  const generatedCode = useMemo(() => PLACEHOLDERS[mode], [mode])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section className="bds-gradients-tool">
      <div className="bds-gradients-tool__tabs" role="tablist" aria-label="Modos de gradiente">
        {MODES.map((item) => {
          const Icon = item.icon
          return (
            <button
              aria-selected={mode === item.id}
              className={mode === item.id ? 'is-active' : ''}
              key={item.id}
              onClick={() => setMode(item.id)}
              role="tab"
              type="button"
            >
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
            <input
              maxLength={60}
              onChange={(event) => setText(event.target.value)}
              placeholder="Digite um nome ou texto"
              type="text"
              value={text}
            />
          </label>

          <div className="bds-gradients-tool__placeholder">
            <strong>Configurações de {MODES.find((item) => item.id === mode)?.label}</strong>
            <p>Os controles específicos deste modo serão adicionados na próxima etapa.</p>
          </div>
        </div>

        <div className="bds-gradients-tool__preview-column">
          <section className="bds-gradients-tool__preview" aria-label="Preview">
            <span>Preview</span>
            <div>{text || 'Seu texto'}</div>
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
