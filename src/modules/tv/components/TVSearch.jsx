import { Search, X } from 'lucide-react'
import { IconButton, Input } from '../../../design-system'

export function TVSearch({ value, onChange }) {
  return (
    <div className="tv-search">
      <Search size={18} aria-hidden="true" />
      <Input
        id="tv-search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar canais"
        aria-label="Buscar canais"
      />
      {value && (
        <IconButton aria-label="Limpar pesquisa" title="Limpar pesquisa" onClick={() => onChange('')}>
          <X size={17} />
        </IconButton>
      )}
    </div>
  )
}
