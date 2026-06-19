import { useContext } from 'react'
import { ThemeContext } from '../utils/ThemeProvider'

export function useTheme() {
  return useContext(ThemeContext)
}
