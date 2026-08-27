import { classNames } from '../utils'
import { SectionHeader } from '../components'

export function Section({ children, eyebrow, title, subtitle, action, icon, className, headerClassName }) {
  return (
    <section className={classNames('bds-section', className)}>
      {(eyebrow || title || subtitle || action || icon) && (
        <SectionHeader
          className={headerClassName}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          action={action}
          icon={icon}
        />
      )}
      {children}
    </section>
  )
}
