import { Tv } from 'lucide-react'
import { Card } from '../../../design-system'

export function TVCategoryCard({ category, active, onSelect }) {
  return (
    <Card
      as="button"
      type="button"
      className={`tv-category-card${active ? ' tv-category-card--active' : ''}`}
      onClick={() => onSelect(category.id)}
    >
      <span className="tv-category-card__icon" style={{ '--tv-category-color': category.color || '#38bdf8' }}>
        <Tv size={18} aria-hidden="true" />
      </span>
      <span>
        <strong>{category.name}</strong>
        {category.description && <small>{category.description}</small>}
      </span>
    </Card>
  )
}
