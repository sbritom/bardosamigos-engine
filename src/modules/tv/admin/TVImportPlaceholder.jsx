import { Import } from 'lucide-react'
import { EmptyState, Panel, StatusBadge } from '../../../design-system'

export function TVImportPlaceholder() {
  return (
    <Panel>
      <EmptyState
        icon={<Import size={32} />}
        title="Importacao disponivel na proxima Sprint"
        description="Nenhum canal sera copiado, raspado ou sincronizado automaticamente nesta versao."
      />
      <StatusBadge status="EM BREVE">EM BREVE</StatusBadge>
    </Panel>
  )
}
