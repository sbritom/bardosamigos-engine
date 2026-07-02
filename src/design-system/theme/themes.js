import { animations, borders, colors, opacity, radius, shadows, spacing, transitions, typography, zIndex } from '../tokens/index.js'

export const darkTheme = Object.freeze({
  name: 'dark',
  colors: colors.dark,
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
