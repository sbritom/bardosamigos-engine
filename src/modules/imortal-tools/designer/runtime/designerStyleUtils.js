export const DESIGNER_LAYOUT_UPDATED_EVENT = 'barstudio:designer-layout-updated'

export function toDesignerCssValue(value, unit = 'px') {
  if (value === '' || value === null || value === undefined) return ''
  if (typeof value === 'number') return `${value}${unit}`
  if (/^-?\d+(\.\d+)?$/.test(String(value))) return `${value}${unit}`
  return String(value)
}

export function buildDesignerInlineStyle(properties = {}) {
  return {
    position: properties.position || '',
    transform: properties.x || properties.y ? `translate(${Number(properties.x || 0)}px, ${Number(properties.y || 0)}px)` : '',
    width: toDesignerCssValue(properties.width),
    height: toDesignerCssValue(properties.height),
    padding: toDesignerCssValue(properties.padding),
    margin: toDesignerCssValue(properties.margin),
    gap: toDesignerCssValue(properties.gap),
    alignItems: properties.alignItems || properties.align || '',
    justifyContent: properties.justifyContent || properties.justify || '',
    background: properties.background || properties.backgroundColor || '',
    backgroundColor: properties.backgroundColor || '',
    borderRadius: toDesignerCssValue(properties.borderRadius),
    boxShadow: properties.shadow || properties.boxShadow || '',
    opacity: properties.opacity || '',
    display: properties.display || '',
    flex: properties.flex || '',
    gridTemplateColumns: properties.grid || properties.gridTemplateColumns || '',
    maxWidth: toDesignerCssValue(properties.maxWidth),
    minWidth: toDesignerCssValue(properties.minWidth),
    fontSize: toDesignerCssValue(properties.fontSize),
    fontWeight: properties.fontWeight || '',
    lineHeight: properties.lineHeight || '',
    letterSpacing: toDesignerCssValue(properties.letterSpacing),
    color: properties.textColor || properties.color || '',
    border: properties.border || '',
    visibility: properties.visibility || '',
    pointerEvents: properties.locked ? 'none' : '',
    '--designer-icon-size': toDesignerCssValue(properties.iconSize),
  }
}

export function sanitizeDesignerStyle(style = {}) {
  return Object.fromEntries(Object.entries(style).filter(([, value]) => value !== '' && value !== null && value !== undefined))
}

export function clearDesignerInlineStyle(element) {
  if (!element) return
  Object.keys(buildDesignerInlineStyle({})).forEach((property) => {
    if (property.startsWith('--')) return
    element.style[property] = ''
  })
  element.style.removeProperty('--designer-icon-size')
}

export function createDesignerLayoutKey(page = 'home', component = '', device = 'desktop', status = 'published') {
  return `${page}:${device}:${status}:${component}`
}

export function getDesignerDevice() {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile'
  if (window.matchMedia('(max-width: 1180px)').matches) return 'tablet'
  return 'desktop'
}
