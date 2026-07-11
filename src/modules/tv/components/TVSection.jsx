import { SectionHeader } from '../../../design-system'

export function TVSection({ eyebrow, title, subtitle, action, children, className = '' }) {
  return (
    <section className={`tv-section ${className}`.trim()}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} action={action} />
      {children}
    </section>
  )
}
