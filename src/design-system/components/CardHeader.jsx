import { classNames } from '../utils'

export function CardHeader({ icon, eyebrow, title, subtitle, action, className }) {
  return (
    <header className={classNames('bds-card-header', className)}>
      {icon && <div className="bds-card-header__icon">{icon}</div>}
      <div className="bds-card-header__content">
        {eyebrow && <p className="bds-card-header__eyebrow">{eyebrow}</p>}
        {title && <h3 className="bds-card-header__title">{title}</h3>}
        {subtitle && <p className="bds-card-header__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="bds-card-header__action">{action}</div>}
    </header>
  )
}
