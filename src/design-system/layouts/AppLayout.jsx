import { classNames } from '../utils'

export function AppLayout({ sidebar, topbar, children, className }) {
  return (
    <div className={classNames('bds-app-layout', className)}>
      {sidebar}
      <main className="bds-app-layout__main">
        {topbar}
        {children}
      </main>
    </div>
  )
}
