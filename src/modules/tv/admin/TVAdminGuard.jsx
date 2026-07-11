import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { ErrorState, LoadingSkeleton, Panel } from '../../../design-system'
import { getDesignerUserAccess } from '../../barstudio/designer/services/layoutDesignerService'

export function TVAdminGuard({ children }) {
  const [access, setAccess] = useState({ loading: true, allowed: false, reason: '' })

  useEffect(() => {
    let active = true
    getDesignerUserAccess().then((result) => {
      if (active) setAccess({ loading: false, ...result })
    })
    return () => {
      active = false
    }
  }, [])

  if (access.loading) {
    return <Panel><LoadingSkeleton rows={5} /></Panel>
  }

  if (!access.allowed) {
    return (
      <Panel>
        <ErrorState
          title="Acesso administrativo necessario"
          description={access.reason || 'Entre com uma conta administradora para acessar o TV Manager.'}
          icon={<ShieldAlert size={28} />}
        />
      </Panel>
    )
  }

  return children
}
