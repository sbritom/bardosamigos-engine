import { isValidElement, useId, useState } from "react"
import { ChevronDown, Inbox, Search } from "lucide-react"
import { HeroCard, StatusBadge, classNames } from "../../design-system"
import "./PortalWorkspace.css"

function renderIcon(icon, size = 16) {
  if (!icon) return null
  if (isValidElement(icon)) return icon
  const Icon = icon
  return <Icon size={size} aria-hidden="true" />
}

function renderHero(hero) {
  if (!hero) return null
  if (hero?.type) return hero
  return <HeroCard className="bds-portal-workspace__hero" {...hero} />
}

export function WorkspaceSearch({
  value,
  onChange,
  placeholder = "Pesquisar...",
  label = "Buscar no workspace",
  disabled = false,
  className,
  ...props
}) {
  return (
    <label className={classNames("bds-workspace-search", className)}>
      <span>{label}</span>
      <div className="bds-workspace-search__control">
        <Search size={16} aria-hidden="true" />
        <input
          aria-label={label}
          disabled={disabled}
          onChange={onChange}
          placeholder={placeholder}
          type="search"
          value={value}
          {...props}
        />
      </div>
    </label>
  )
}

export function WorkspaceHeader({ eyebrow, title, description, search, actions, className }) {
  return (
    <header className={classNames("bds-workspace-header", className)}>
      <div className="bds-workspace-header__copy">
        {eyebrow && <span>{eyebrow}</span>}
        {title && <h1>{title}</h1>}
        {description && <p>{description}</p>}
      </div>
      {(search || actions) && (
        <div className="bds-workspace-header__tools">
          {search}
          {actions}
        </div>
      )}
    </header>
  )
}

export function WorkspaceSidebar({
  title = "Navegacao",
  items = [],
  selectedId,
  onSelect,
  ariaLabel,
  className,
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <aside className={classNames("bds-workspace-sidebar", open && "is-open", className)} aria-label={ariaLabel || title}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="bds-workspace-sidebar__toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{title}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      <nav className="bds-workspace-sidebar__panel" id={panelId} aria-label={ariaLabel || title}>
        <h2>{title}</h2>
        <div className="bds-workspace-sidebar__list" role="list">
          {items.map((item) => {
            const selected = item.selected ?? item.id === selectedId
            return (
              <button
                aria-current={selected ? "page" : undefined}
                className={classNames("bds-workspace-sidebar__item", selected && "is-selected")}
                disabled={item.disabled}
                key={item.id}
                onClick={() => {
                  item.onClick?.(item)
                  onSelect?.(item)
                  setOpen(false)
                }}
                type="button"
              >
                <span className="bds-workspace-sidebar__item-icon">{renderIcon(item.icon)}</span>
                <span className="bds-workspace-sidebar__item-copy">
                  <strong>{item.name}</strong>
                  {item.description && <small>{item.description}</small>}
                </span>
                {item.badge ? <span className="bds-workspace-sidebar__badge">{item.badge}</span> : null}
                {item.status ? <StatusBadge status={item.status} /> : null}
              </button>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

export function WorkspaceContent({ title, description, actions, children, className }) {
  return (
    <section className={classNames("bds-workspace-content", className)} aria-label={title || "Conteudo do workspace"}>
      {(title || description || actions) && (
        <header className="bds-workspace-content__header">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="bds-workspace-content__actions">{actions}</div>}
        </header>
      )}
      <div className="bds-workspace-content__body">{children}</div>
    </section>
  )
}

export function WorkspaceSection({ title, description, action, children, className }) {
  return (
    <section className={classNames("bds-workspace-section", className)}>
      {(title || description || action) && (
        <header className="bds-workspace-section__header">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function WorkspaceEmptyState({ icon, title = "Nada para mostrar.", description, action, className }) {
  const EmptyIcon = icon || Inbox

  return (
    <div className={classNames("bds-workspace-empty", className)} role="status">
      <div className="bds-workspace-empty__icon">{renderIcon(EmptyIcon, 22)}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function WorkspaceSkeleton({ rows = 4, className }) {
  return (
    <div className={classNames("bds-workspace-skeleton", className)} aria-label="Carregando" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

export function PortalWorkspace({
  hero,
  header,
  sidebar,
  content,
  children,
  className,
}) {
  return (
    <main className={classNames("bds-portal-workspace", className)}>
      {renderHero(hero)}
      {header ? <WorkspaceHeader {...header} /> : null}
      <div className="bds-portal-workspace__layout">
        {sidebar ? <WorkspaceSidebar {...sidebar} /> : null}
        <WorkspaceContent {...content}>{children}</WorkspaceContent>
      </div>
    </main>
  )
}
