import { useCallback, useEffect } from 'react'
import { RadioTower } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Panel,
  ResponsiveContainer,
  SectionHeader,
  StatusBadge,
  Toast,
  useToast,
} from '../../../design-system'
import { TVAdminGuard } from './TVAdminGuard'
import { TVCategoryManager } from './TVCategoryManager'
import { TVChannelManager } from './TVChannelManager'
import { TVDashboard } from './TVDashboard'
import { TVFeaturedManager } from './TVFeaturedManager'
import { TVImportPlaceholder } from './TVImportPlaceholder'
import { TVSettings } from './TVSettings'
import { TV_ADMIN_SECTIONS } from './config'
import './tvManager.css'

const titles = {
  dashboard: ['Dashboard da TV', 'Visao geral operacional com dados reais do catalogo.'],
  categories: ['Categorias', 'Organize o catalogo e controle a ordem de exibicao.'],
  channels: ['Canais', 'Cadastre, revise e publique canais sem editar codigo.'],
  featured: ['Destaques', 'Gerencie prioridade e periodo editorial do Hero da TV.'],
  settings: ['Configuracoes', 'Consulte provedores e politicas de seguranca da plataforma.'],
  import: ['Importacao', 'Estrutura reservada para a proxima Sprint.'],
}

export function TVManager({ section = 'dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { toasts, pushToast, removeToast } = useToast()
  const [title, subtitle] = titles[section] || titles.dashboard

  const notify = useCallback((status, toastTitle, message = '') => {
    pushToast({ status, title: toastTitle, message })
  }, [pushToast])

  const navigateTo = useCallback((target, state) => {
    const destination = TV_ADMIN_SECTIONS.find((item) => item.id === target)
    if (destination) navigate(destination.path, { state })
  }, [navigate])

  const createRequested = Boolean(location.state?.create)

  useEffect(() => {
    if (location.state?.create) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const content = {
    dashboard: <TVDashboard navigateTo={navigateTo} />,
    categories: <TVCategoryManager createRequested={createRequested} notify={notify} />,
    channels: <TVChannelManager createRequested={createRequested} notify={notify} />,
    featured: <TVFeaturedManager notify={notify} />,
    settings: <TVSettings />,
    import: <TVImportPlaceholder />,
  }[section] || <TVDashboard navigateTo={navigateTo} />

  return (
    <TVAdminGuard>
      <ResponsiveContainer size="xl" className="tv-manager">
        <header className="tv-manager__header">
          <div className="tv-manager__brand">
            <RadioTower size={24} aria-hidden="true" />
            <div>
              <span>BAR DOS AMIGOS</span>
              <strong>TV Manager</strong>
            </div>
          </div>
          <StatusBadge status="ADMIN">ACESSO ADMINISTRATIVO</StatusBadge>
        </header>

        <div className="tv-manager__layout">
          <Panel as="nav" className="tv-manager__nav" aria-label="TV Manager">
            {TV_ADMIN_SECTIONS.map(({ id, label, icon: Icon, path, upcoming }) => (
              <NavLink
                key={id}
                to={path}
                end={id === 'dashboard'}
                className={({ isActive }) => `tv-manager__nav-link${isActive ? ' tv-manager__nav-link--active' : ''}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                {upcoming && <small>Em breve</small>}
              </NavLink>
            ))}
          </Panel>

          <main className="tv-manager__content">
            <SectionHeader eyebrow="TV PLATFORM" title={title} subtitle={subtitle} />
            <Panel className="tv-manager__workspace">{content}</Panel>
          </main>
        </div>

        <div className="tv-manager__toasts" aria-live="polite">
          {toasts.map((toast) => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
        </div>
      </ResponsiveContainer>
    </TVAdminGuard>
  )
}
