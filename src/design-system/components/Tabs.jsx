import { classNames } from '../utils'

export function Tabs({ tabs = [], value, onChange, className }) {
  return (
    <div className={classNames('bds-tabs', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          className={classNames('bds-tab', tab.value === value && 'bds-tab--active')}
          onClick={() => onChange?.(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
