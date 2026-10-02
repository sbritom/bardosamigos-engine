import { Pipette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatColor, normalizeHex, parseColor } from './imageToolUtils'

export default function ImageColorField({ label, value, onChange }) {
  const [format, setFormat] = useState('hex')
  const [textValue, setTextValue] = useState(() => formatColor(value, 'hex'))

  useEffect(() => {
    setTextValue(formatColor(value, format))
  }, [format, value])

  const commitText = () => {
    const parsed = parseColor(textValue, format)
    if (parsed) onChange(parsed)
    else setTextValue(formatColor(value, format))
  }

  const pickFromScreen = async () => {
    if (!window.EyeDropper) return
    try {
      const result = await new window.EyeDropper().open()
      const color = normalizeHex(result.sRGBHex)
      if (color) onChange(color)
    } catch {
      // The user can cancel the native eyedropper without showing an error.
    }
  }

  return (
    <div className="bds-image-color-field">
      <span>{label}</span>
      <div>
        <input aria-label={`${label}: seletor de cor`} type="color" value={normalizeHex(value) || '#000000'} onChange={(event) => onChange(event.target.value.toUpperCase())} />
        <select aria-label={`${label}: formato`} value={format} onChange={(event) => setFormat(event.target.value)}>
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
        </select>
        <input
          aria-label={`${label}: valor`}
          type="text"
          value={textValue}
          onBlur={commitText}
          onChange={(event) => setTextValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') commitText() }}
        />
        {window.EyeDropper && <button aria-label={`Usar conta-gotas para ${label}`} onClick={pickFromScreen} title="Conta-gotas" type="button"><Pipette size={16} /></button>}
      </div>
    </div>
  )
}
