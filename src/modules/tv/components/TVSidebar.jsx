import { Clock3, Heart, LayoutGrid } from 'lucide-react'
import { Button } from '../../../design-system'

const items = [
  { id: 'all', label: 'Todos os canais', icon: LayoutGrid },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'recent', label: 'Recentes', icon: Clock3 },
]

export function TVSidebar({ active = 'all', onChange }) {
  return (
    <aside className="tv-sidebar" aria-label="Navegacao da TV">
      {items.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={active === id ? 'primary' : 'ghost'}
          onClick={() => onChange(id)}
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </Button>
      ))}
    </aside>
  )
}
