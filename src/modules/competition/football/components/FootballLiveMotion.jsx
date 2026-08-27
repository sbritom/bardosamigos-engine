import { memo, useEffect, useRef, useState } from 'react'

export const FootballLiveValue = memo(function FootballLiveValue({
  as: Component = 'span',
  value,
  children,
  className = '',
  highlight = false,
  ariaLive = 'polite',
}) {
  const previousValue = useRef(value)
  const [changed, setChanged] = useState(false)
  const [highlighted, setHighlighted] = useState(false)

  useEffect(() => {
    if (previousValue.current === value) return undefined

    previousValue.current = value
    setChanged(true)
    const changedTimer = window.setTimeout(() => setChanged(false), 150)
    let highlightTimer = null

    if (highlight) {
      setHighlighted(true)
      highlightTimer = window.setTimeout(() => setHighlighted(false), 2000)
    }

    return () => {
      window.clearTimeout(changedTimer)
      if (highlightTimer) window.clearTimeout(highlightTimer)
    }
  }, [highlight, value])

  return (
    <Component
      className={`bds-football-live-value ${className}`}
      data-live-changing={changed ? 'true' : undefined}
      data-goal-pulse={highlighted ? 'true' : undefined}
      aria-live={ariaLive}
    >
      {children ?? value}
    </Component>
  )
})
