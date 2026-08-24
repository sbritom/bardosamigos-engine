import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { ErrorState, LoadingSkeleton, Panel } from '../../../design-system'
import { ADMIN_ROLES, getAdminAccess } from '../../../core/auth/adminAuthService.js'

export function TVAdminGuard({ children }) {
  const [access, setAccess] = useState({ loading: true, allowed: false, reason: '' })

  useEffect(() => {
    let active = true

    getAdminAccess({
      allowedRoles: [ADMIN_ROLES.ADMIN],
      allowLegacyUserMetadata: false,
    }).then((result) => {
      if (active) setAccess({ loading: false, ...result })
    }).catch((error) => {
      if (active) {
        setAccess({
          loading: false,
          allowed: false,
          reason: error.message || 'Acesso restrito a administradores.',
        })
      }
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
