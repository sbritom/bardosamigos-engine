import { useEffect, useMemo, useState } from 'react'
import { getCountdownParts } from '../../../../core/time'

function getRemaining(targetDate) {
  return getCountdownParts(targetDate)
}

export function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate))

  useEffect(() => {
    const intervalMs = remaining.hours > 24 ? 60000 : remaining.hours > 1 ? 15000 : 1000
    const timer = window.setInterval(() => {
      setRemaining(getRemaining(targetDate))
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [remaining.hours, targetDate])

  return useMemo(() => remaining, [remaining])
}
