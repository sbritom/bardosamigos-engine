import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getSupabaseClient } from '../../../../core/database'
import {
  buildDesignerInlineStyle,
  clearDesignerInlineStyle,
  createDesignerLayoutKey,
  DESIGNER_LAYOUT_UPDATED_EVENT,
  getDesignerDevice,
  sanitizeDesignerStyle,
} from './designerStyleUtils'

const DesignerRuntimeContext = createContext(null)

function mapLayoutRows(rows = []) {
  const next = {}
  rows.forEach((row) => {
    const key = createDesignerLayoutKey(row.page, row.component, row.device, row.status)
    next[key] = row.properties || {}
  })
  return next
}

function applyLayoutToDom({ page, device, layouts, draftLayouts, previewDraft }) {
  if (typeof document === 'undefined') return

  document.querySelectorAll('[data-designer-id]').forEach((element) => {
    const component = element.dataset.designerId
    const draftKey = createDesignerLayoutKey(page, component, device, 'draft')
    const publishedKey = createDesignerLayoutKey(page, component, device, 'published')
    const properties = previewDraft ? draftLayouts[draftKey] || layouts[publishedKey] : layouts[publishedKey]

    clearDesignerInlineStyle(element)
    if (!properties) return
    Object.assign(element.style, sanitizeDesignerStyle(buildDesignerInlineStyle(properties)))
  })
}

export function DesignerRuntimeProvider({ children, page = 'home' }) {
  const [device, setDevice] = useState(getDesignerDevice)
  const [layouts, setLayouts] = useState({})
  const [draftLayouts, setDraftLayouts] = useState({})
  const [previewDraft, setPreviewDraft] = useState(false)
  const [lastError, setLastError] = useState(null)
  const channelRef = useRef(null)

  const loadLayouts = useCallback(async () => {
    const client = getSupabaseClient()
    if (!client) return

    const { data, error } = await client
      .from('layout_settings')
      .select('page,component,device,status,properties,updated_at')
      .eq('page', page)
      .eq('device', device)
      .is('deleted_at', null)
      .in('status', ['published', 'draft'])

    if (error) {
      setLastError(error)
      return
    }

    const rows = data || []
    setLayouts(mapLayoutRows(rows.filter((row) => row.status === 'published')))
    setDraftLayouts(mapLayoutRows(rows.filter((row) => row.status === 'draft')))
    setLastError(null)
  }, [device, page])

  useEffect(() => {
    function updateDevice() {
      setDevice(getDesignerDevice())
    }
    window.addEventListener('resize', updateDevice)
    return () => window.removeEventListener('resize', updateDevice)
  }, [])

  useEffect(() => {
    loadLayouts()
  }, [loadLayouts])

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client?.channel) return undefined

    channelRef.current?.unsubscribe?.()
    channelRef.current = client
      .channel(`layout-settings-${page}-${device}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'layout_settings', filter: `page=eq.${page}` },
        () => loadLayouts(),
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe?.()
      channelRef.current = null
    }
  }, [device, loadLayouts, page])

  useEffect(() => {
    function onLayoutUpdated() {
      loadLayouts()
    }
    window.addEventListener(DESIGNER_LAYOUT_UPDATED_EVENT, onLayoutUpdated)
    return () => window.removeEventListener(DESIGNER_LAYOUT_UPDATED_EVENT, onLayoutUpdated)
  }, [loadLayouts])

  useEffect(() => {
    applyLayoutToDom({ page, device, layouts, draftLayouts, previewDraft })
  }, [page, device, layouts, draftLayouts, previewDraft])

  const getLayout = useCallback((component, options = {}) => {
    const requestedPage = options.page || page
    const requestedDevice = options.device || device
    const publishedKey = createDesignerLayoutKey(requestedPage, component, requestedDevice, 'published')
    const draftKey = createDesignerLayoutKey(requestedPage, component, requestedDevice, 'draft')
    const draft = draftLayouts[draftKey] || null
    const published = layouts[publishedKey] || null
    const applied = options.previewDraft ?? previewDraft ? draft || published : published

    return {
      component,
      page: requestedPage,
      device: requestedDevice,
      defaultLayout: {},
      publishedLayout: published,
      draftLayout: draft,
      appliedLayout: applied || {},
      style: sanitizeDesignerStyle(buildDesignerInlineStyle(applied || {})),
      origin: draft && (options.previewDraft ?? previewDraft) ? 'draft' : published ? 'published' : 'default',
    }
  }, [device, draftLayouts, layouts, page, previewDraft])

  const setRuntimeDraftLayouts = useCallback((settings = {}, options = {}) => {
    const requestedPage = options.page || page
    const requestedDevice = options.device || device
    const next = {}
    Object.entries(settings).forEach(([component, properties]) => {
      next[createDesignerLayoutKey(requestedPage, component, requestedDevice, 'draft')] = properties || {}
    })
    setDraftLayouts(next)
  }, [device, page])

  const value = useMemo(() => ({
    device,
    page,
    layouts,
    draftLayouts,
    previewDraft,
    lastError,
    getLayout,
    reloadLayouts: loadLayouts,
    setPreviewDraft,
    setRuntimeDraftLayouts,
  }), [device, draftLayouts, getLayout, lastError, layouts, loadLayouts, page, previewDraft, setRuntimeDraftLayouts])

  return (
    <DesignerRuntimeContext.Provider value={value}>
      {children}
    </DesignerRuntimeContext.Provider>
  )
}

export function useDesignerRuntime() {
  return useContext(DesignerRuntimeContext)
}
