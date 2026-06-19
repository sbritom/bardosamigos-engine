import { createContext, useMemo, useState } from 'react'
import { themes } from '../theme'

export const ThemeContext = createContext({
  themeName: 'dark',
  theme: themes.dark,
  setThemeName: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children, defaultTheme = 'dark' }) {
  const [themeName, setThemeName] = useState(defaultTheme)
  const theme = themes[themeName] || themes.dark
  const value = useMemo(
    () => ({
      themeName,
      theme,
      setThemeName,
      toggleTheme: () => setThemeName((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme, themeName],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
