import { animations, borders, colors, opacity, radius, shadows, spacing, transitions, typography, zIndex } from '../tokens/index.js'

export const officialPalette = Object.freeze({
  background: '#010A26',
  surface: '#021140',
  primary: '#03318C',
  primaryHover: '#056CF2',
  text: '#FFFFFF',
  textSecondary: '#AFC2FF',
  border: 'rgba(5,108,242,.15)',
  glow: 'rgba(5,108,242,.30)',
  radius: '16px',
})

export const darkTheme = Object.freeze({
  name: 'dark',
  colors: colors.dark,
  palette: officialPalette,
  typography,
  spacing,
  borders,
  shadows,
  animations,
  transitions,
  opacity,
  zIndex,
  radius,
})

export const lightTheme = Object.freeze({
  name: 'light',
  colors: colors.light,
  palette: officialPalette,
  typography,
  spacing,
  borders,
  shadows,
  animations,
  transitions,
  opacity,
  zIndex,
  radius,
})

export const themes = Object.freeze({
  dark: darkTheme,
  light: lightTheme,
})
