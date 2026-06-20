import { useEffect, useMemo, useState } from 'react'

function getRemaining(targetDate) {
  const difference = Math.max(0, new Date(targetDate).getTime() - Date.now())
  const hours = Math.floor(difference / 1000 / 60 / 60)
  const minutes = Math.floor((difference / 1000 / 60) % 60)
  const seconds = Math.floor((difference / 1000) % 60)

  return { hours, minutes, seconds }
}

export function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemaining(targetDate))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [targetDate])

  return useMemo(() => remaining, [remaining])
}
