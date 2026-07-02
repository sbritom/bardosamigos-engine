import { classNames } from '../utils'

export function SectionHeader({ icon, eyebrow, title, subtitle, description, action, className }) {
  const supportingText = subtitle || description

  return (
    <header className={classNames('bds-section-header', className)}>
      {icon && <div className="bds-section-header__icon">{icon}</div>}
      <div className="bds-section-header__content">
        {eyebrow && <p className="bds-section-header__eyebrow">{eyebrow}</p>}
        {title && <h2 className="bds-section-header__title">{title}</h2>}
        {supportingText && <p className="bds-section-header__description">{supportingText}</p>}
      </div>
      {action && <div className="bds-section-header__action">{action}</div>}
    </header>
  )
}
