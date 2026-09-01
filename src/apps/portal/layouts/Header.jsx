import {
  Gamepad2,
  Home,
  Menu,
  Music2,
  ShieldCheck,
  Trophy,
  Tv,
  UserCircle,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import Container from '../../../shared/layout/Container'
import { useAuth } from '../../../modules/auth/AuthContext'
import {
  isLocalAdminEnabled,
  isLocalDesignerEnvironment,
  toggleLocalAdmin,
} from '../../../modules/barstudio/designer/services/layoutDesignerService'
import RadioBar from './RadioBar'
import '../../../design-system/styles/index.css'

const IMORTAL_HOME_MENU = [
  { id: 'home', title: 'Início', path: '/', icon: Home },
  { id: 'tv', title: 'TV', path: '/tv', icon: Tv },
  { id: 'football', title: 'Futebol', path: '/football', icon: Trophy },
  { id: 'games', title: 'Games', path: '/games', icon: Gamepad2 },
  { id: 'music', title: 'Rádio', path: '/radio', icon: Music2 },
  { id: 'organization', title: 'Comunidade', path: '/community', icon: Users },
]

export default function Header() {
  const navigate = useNavigate()
  const { isAuthenticated, displayName, profile, user } = useAuth()
  const showLocalAdmin = isLocalDesignerEnvironment()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [localAdminEnabled, setLocalAdminEnabledState] = useState(() =>
    showLocalAdmin ? isLocalAdminEnabled() : false,
  )

  const profileLabel = isAuthenticated
    ? `Perfil de ${displayName || user?.email || 'usuario'}`
    : 'Entrar ou acessar perfil'

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
      <header className="bds-top-header imortal-header" data-designer-id="header" data-designer-label="Header">
        <Container>
          <div className="bds-top-header__bar imortal-header__bar">
            <button
              className="bds-top-header__icon-button imortal-header__menu-toggle"
              type="button"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="imortal-mobile-menu"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={22} />}
            </button>

            <NavLink
              to="/"
              end
              className="imortal-header__brand-link"
              data-designer-id="header.logo"
              data-designer-label="Header / Logo"
              aria-label="IMORTAL0800 - Início"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="bds-top-header__brand-title imortal-header__brand" data-designer-id="header.title" data-designer-label="Header / Titulo">
                IMORTAL<span>0800</span>
              </div>
            </NavLink>

            <nav
              className="imortal-header__desktop-nav"
              aria-label="Menu principal"
              data-designer-id="header.menu"
              data-designer-label="Header / Menu"
            >
              {IMORTAL_HOME_MENU.map((item) => {
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

            <div className="imortal-header__actions" data-designer-id="header.actions" data-designer-label="Header / Acoes">
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

              <button
                className={`bds-top-header__icon-button ${isAuthenticated ? 'bds-top-header__icon-button--active' : ''}`}
                type="button"
                aria-label={profileLabel}
                title={profileLabel}
                onClick={() => navigate('/profile')}
              >
                {isAuthenticated && profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                    aria-hidden="true"
                  />
                ) : (
                  <UserCircle size={20} />
                )}
              </button>
            </div>
          </div>

          <nav
            id="imortal-mobile-menu"
            className={`bds-top-header__mobile-nav imortal-header__mobile-nav ${mobileMenuOpen ? 'is-open' : ''}`}
            aria-label="Menu principal mobile"
          >
            {IMORTAL_HOME_MENU.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `bds-top-header__mobile-link ${isActive ? 'bds-top-header__mobile-link--active' : ''}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={15} />
                  {item.title}
                </NavLink>
              )
            })}
          </nav>
        </Container>
      </header>

      <RadioBar />
    </>
  )
}
