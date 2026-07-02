import { useMemo } from 'react'
import { buildDesignerInlineStyle, sanitizeDesignerStyle } from '../runtime/designerStyleUtils'
import { useDesignerRuntime } from '../runtime/DesignerRuntimeProvider'

export function useDesignerLayout(page = 'home', component, element, options = {}) {
  const runtime = useDesignerRuntime()
  const componentId = element ? `${component}.${element}` : component

  return useMemo(() => {
    if (!runtime || !componentId) {
      return {
        component: componentId,
        page,
        defaultLayout: {},
        publishedLayout: null,
        draftLayout: null,
        appliedLayout: {},
        style: {},
        origin: 'default',
      }
    }

    return runtime.getLayout(componentId, { ...options, page })
  }, [componentId, options, page, runtime])
}

export function useDesignerStyle(page = 'home', component, element, options = {}) {
  const layout = useDesignerLayout(page, component, element, options)
  return sanitizeDesignerStyle(buildDesignerInlineStyle(layout.appliedLayout || {}))
}
