import { Check, Copy } from 'lucide-react'

const LINK_LABELS = {
  direct: 'Link direto',
  public: 'URL pública',
  html: 'HTML',
  bbcode: 'BBCode',
  markdown: 'Markdown',
}

export default function StorageLinks({ links, copied, onCopy }) {
  if (!links) return null
  return (
    <section className="bds-storage-links" aria-labelledby="storage-links-title">
      <h4 id="storage-links-title">Links gerados</h4>
      <div>
        {Object.entries(links).map(([type, value]) => (
          <label key={type}>
            <span>{LINK_LABELS[type]}</span>
            <span className="bds-storage-links__field">
              <input aria-label={LINK_LABELS[type]} readOnly value={value} />
              <button aria-label={`Copiar ${LINK_LABELS[type]}`} onClick={() => onCopy(type, value)} type="button">
                {copied === type ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              </button>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}

