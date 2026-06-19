import { animations, borders, colors, radius, shadows, spacing, typography } from '../tokens'

export const darkTheme = Object.freeze({
  name: 'dark',
  colors: colors.dark,
  typography,
  spacing,
  borders,
  shadows,
  animations,
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
  radius,
})

export const themes = Object.freeze({
  dark: darkTheme,
  light: lightTheme,
})
