import { classNames } from '../utils'

export function DashboardGrid({ children, columns = 12, gap = 'md', className }) {
  return (
    <div className={classNames('bds-dashboard-grid', `bds-dashboard-grid--${columns}`, `bds-dashboard-grid--gap-${gap}`, className)}>
      {children}
    </div>
  )
}
