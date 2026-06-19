import { useEffect, useState } from 'react'

const breakpoints = Object.freeze({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
})

function getBreakpoint(width) {
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'xs'
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() =>
    typeof window === 'undefined' ? 'lg' : getBreakpoint(window.innerWidth),
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const onResize = () => setBreakpoint(getBreakpoint(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return breakpoint
}
