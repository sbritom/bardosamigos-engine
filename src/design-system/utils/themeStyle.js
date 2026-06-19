export function createThemeStyle(theme) {
  return {
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    fontFamily: theme.typography.fontFamily,
  }
}
