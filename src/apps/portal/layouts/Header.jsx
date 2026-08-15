import { Beer, Search, ShieldCheck, Sun, UserCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

import Container from '../../../shared/layout/Container'
import { getMenuPlugins } from '../../../core/registry/plugins'
import { isLocalAdminEnabled, isLocalDesignerEnvironment, toggleLocalAdmin } from '../../../modules/barstudio/designer/services/layoutDesignerService'
import RadioBar from './RadioBar'
import '../../../design-system/styles/index.css'

const PUBLIC_HOME_MENU = ['home', 'tv', 'radio', 'football', 'news', 'events', 'tools']
const PUBLIC_HOME_MENU_ORDER = new Map(PUBLIC_HOME_MENU.map((id, index) => [id, index]))

export default function Header() {
  const menu = getMenuPlugins()
    .filter((item) => PUBLIC_HOME_MENU_ORDER.has(item.id))
    .sort((first, second) => PUBLIC_HOME_MENU_ORDER.get(first.id) - PUBLIC_HOME_MENU_ORDER.get(second.id))
  const showLocalAdmin = isLocalDesignerEnvironment()
  const [localAdminEnabled, setLocalAdminEnabledState] = useState(() => (showLocalAdmin ? isLocalAdminEnabled() : false))

  useEffect(() => {
    if (!showLocalAdmin) return undefined

    function handleLocalAdminUpdate() {
      setLocalAdminEnabledState(isLocalAdminEnabled())
    }

    window.addEventListener('barstudio:local-admin-updated', handleLocalAdminUpdate)
    return () => window.removeEventListener('barstudio:local-admin-updated', handleLocalAdminUpdate)
  }, [showLocalAdmin])

  return (
    <>
      <RadioBar />

      <header className="bds-top-header" data-designer-id="header" data-designer-label="Header">
        <Container>
          <div className="bds-top-header__bar">
            <div className="flex min-w-0 items-center gap-3" data-designer-id="header.logo" data-designer-label="Header / Logo">
              <div className="bds-top-header__brand-icon" data-designer-id="header.logoIcon" data-designer-label="Header / Icone">
                <Beer size={36} />
              </div>

              <div className="min-w-0">
                <div className="bds-top-header__brand-title" data-designer-id="header.title" data-designer-label="Header / Titulo">
                  BAR DOS <span>AMIGOS</span>
                </div>
              </div>
            </div>

            <nav className="hidden flex-1 justify-center gap-2 xl:flex" aria-label="Menu principal" data-designer-id="header.menu" data-designer-label="Header / Menu">
              {menu.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `bds-top-header__nav-link ${isActive ? 'bds-top-header__nav-link--active' : ''}`
                    }
                  >
                    <Icon size={16} />
                    {item.title}
                  </NavLink>
                )
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2 text-sm" data-designer-id="header.actions" data-designer-label="Header / Acoes">
              <button className="bds-top-header__icon-button" type="button" aria-label="Pesquisar">
                <Search size={18} />
              </button>
              <button className="bds-top-header__icon-button" type="button" aria-label="Tema">
                <Sun size={18} />
              </button>
              {showLocalAdmin && (
                <button
                  className={`bds-top-header__icon-button ${localAdminEnabled ? 'bds-top-header__icon-button--active' : ''}`}
                  type="button"
                  aria-label={localAdminEnabled ? 'Desativar administrador local' : 'Entrar como Administrador'}
                  title={localAdminEnabled ? 'Admin Local ativo' : 'Entrar como Administrador'}
                  onClick={() => setLocalAdminEnabledState(toggleLocalAdmin())}
                >
                  <ShieldCheck size={18} />
                </button>
              )}
              <button className="bds-top-header__icon-button" type="button" aria-label="Perfil">
                <UserCircle size={20} />
              </button>
            </div>
          </div>
          <nav className="bds-top-header__mobile-nav" aria-label="Menu principal mobile">
            {menu.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `bds-top-header__mobile-link ${isActive ? 'bds-top-header__mobile-link--active' : ''}`
                  }
                >
                  <Icon size={14} />
                  {item.title}
                </NavLink>
              )
            })}
          </nav>
        </Container>
      </header>
    </>
  )
}
