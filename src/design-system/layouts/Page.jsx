import { classNames } from '../utils'

export function Page({ title, description, actions, children, className }) {
  return (
    <section className={classNames('bds-page', className)}>
      <header className="bds-page__header">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}
