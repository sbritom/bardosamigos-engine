import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, Grid2X2, Redo2, RotateCcw, Save, Send, Undo2 } from 'lucide-react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  SectionHeader,
  StatusBadge,
} from '../../../../design-system'
import HomePage from '../../../../apps/portal/pages/HomePage'
import {
  getDesignerUserAccess,
  listLayoutSettings,
  resetLayoutSetting,
  saveLayoutSetting,
} from '../services/layoutDesignerService'
import { useDesignerRuntime } from '../runtime'

const DEFAULT_PROPS = {
  x: 0,
  y: 0,
  width: '',
  height: '',
  padding: '',
  margin: '',
  gap: '',
  alignItems: '',
  justifyContent: '',
  backgroundColor: '',
  borderRadius: '',
  boxShadow: '',
  opacity: '',
  display: '',
  maxWidth: '',
  minWidth: '',
  fontSize: '',
  fontWeight: '',
  lineHeight: '',
  letterSpacing: '',
  color: '',
  iconSize: '',
  border: '',
  visibility: '',
  locked: false,
}

const DEVICES = ['desktop', 'tablet', 'mobile']
const MODES = [
  { id: 'section', label: 'Selecionar Secao' },
  { id: 'element', label: 'Selecionar Elemento' },
]
const LAYOUT_THEMES = ['Layout Padrao', 'Layout Copa', 'Layout Sao Joao', 'Layout Natal', 'Layout Palmeiras', 'Layout Halloween']

const COMPONENT_TREE = [
  {
    id: 'home',
    label: 'Home',
    children: [
      { id: 'header', label: 'Header', children: [
        { id: 'header.logo', label: 'Logo' },
        { id: 'header.title', label: 'Titulo' },
        { id: 'header.subtitle', label: 'Subtitulo' },
        { id: 'header.menu', label: 'Menu' },
        { id: 'header.online', label: 'Online' },
      ] },
      { id: 'hero', label: 'Hero', children: [
        { id: 'hero.competition', label: 'Competicao' },
        { id: 'hero.status', label: 'Status' },
        { id: 'hero.homeCrest', label: 'Escudo Mandante' },
        { id: 'hero.homeName', label: 'Nome Mandante' },
        { id: 'hero.score', label: 'Placar' },
        { id: 'hero.awayName', label: 'Nome Visitante' },
        { id: 'hero.awayCrest', label: 'Escudo Visitante' },
        { id: 'hero.info', label: 'Informacoes' },
        { id: 'hero.watchButton', label: 'Botao Assistir' },
        { id: 'hero.competitionButton', label: 'Botao Competition' },
      ] },
      { id: 'tv', label: 'TV', children: [
        { id: 'tv.player', label: 'Player' },
        { id: 'tv.content', label: 'Cabecalho' },
        { id: 'tv.categories', label: 'Categorias' },
      ] },
      { id: 'chat', label: 'Chat', children: [
        { id: 'chat.iframe', label: 'Iframe' },
      ] },
      { id: 'football', label: 'Futebol', children: [
        { id: 'football.cards', label: 'Cards' },
        { id: 'football.results', label: 'Resultados' },
      ] },
      { id: 'news', label: 'Noticias', children: [
        { id: 'news.cards', label: 'Cards' },
      ] },
      { id: 'radio', label: 'Radio', children: [
        { id: 'radio.player', label: 'Player' },
        { id: 'radio.currentTrack', label: 'Musica Atual' },
        { id: 'radio.volume', label: 'Volume' },
        { id: 'radio.buttons', label: 'Botoes' },
      ] },
      { id: 'community', label: 'Comunidade', children: [
        { id: 'community.stats', label: 'Estatisticas' },
        { id: 'community.events', label: 'Eventos' },
      ] },
      { id: 'barstudio', label: 'BarStudio', children: [
        { id: 'barstudio.tools', label: 'Ferramentas' },
        { id: 'barstudio.tool.0', label: 'Card Ferramenta' },
        { id: 'barstudio.icon.0', label: 'Icone Ferramenta' },
      ] },
      { id: 'footer', label: 'Footer' },
    ],
  },
]

function toCssValue(value, unit = 'px') {
  if (value === '' || value === null || value === undefined) return ''
  if (typeof value === 'number') return `${value}${unit}`
  if (/^-?\d+(\.\d+)?$/.test(String(value))) return `${value}${unit}`
  return String(value)
}

function buildInlineStyle(properties = {}) {
  return {
    transform: properties.x || properties.y ? `translate(${Number(properties.x || 0)}px, ${Number(properties.y || 0)}px)` : '',
    width: toCssValue(properties.width),
    height: toCssValue(properties.height),
    padding: toCssValue(properties.padding),
    margin: toCssValue(properties.margin),
    gap: toCssValue(properties.gap),
    alignItems: properties.alignItems || '',
    justifyContent: properties.justifyContent || '',
    backgroundColor: properties.backgroundColor || '',
    borderRadius: toCssValue(properties.borderRadius),
    boxShadow: properties.boxShadow || '',
    opacity: properties.opacity || '',
    display: properties.display || '',
    maxWidth: toCssValue(properties.maxWidth),
    minWidth: toCssValue(properties.minWidth),
    fontSize: toCssValue(properties.fontSize),
    fontWeight: properties.fontWeight || '',
    lineHeight: properties.lineHeight || '',
    letterSpacing: toCssValue(properties.letterSpacing),
    color: properties.color || '',
    border: properties.border || '',
    visibility: properties.visibility || '',
    pointerEvents: properties.locked ? 'none' : '',
    '--designer-icon-size': toCssValue(properties.iconSize),
  }
}

function getElement(id) {
  return id ? document.querySelector(`[data-designer-id="${id}"]`) : null
}

function PropertyInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="bds-designer-field">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function PropertyGroup({ title, children }) {
  return (
    <section className="bds-designer-property-group">
      <h3>{title}</h3>
      <div className="bds-designer-form">{children}</div>
    </section>
  )
}

function TreeNode({ node, selectedId, onSelect, depth = 0 }) {
  const exists = node.id === 'home' || Boolean(getElement(node.id))
  return (
    <div className="bds-designer-tree-node">
      <button
        type="button"
        className={`bds-designer-tree-button ${selectedId === node.id ? 'bds-designer-tree-button--active' : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        disabled={!exists}
        onClick={() => exists && node.id !== 'home' && onSelect({ id: node.id, label: node.label })}
      >
        <span>{node.label}</span>
        {!exists && <small>offline</small>}
      </button>
      {node.children?.map((child) => (
        <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  )
}

function ComponentTree({ selected, onSelect }) {
  return (
    <Panel elevated className="bds-designer-tree">
      <SectionHeader eyebrow="Camadas" title="Arvore de Componentes" subtitle="Selecione secoes ou elementos internos." />
      <div className="bds-designer-tree-list">
        {COMPONENT_TREE.map((node) => (
          <TreeNode key={node.id} node={node} selectedId={selected?.id} onSelect={onSelect} />
        ))}
      </div>
    </Panel>
  )
}

function DesignerPanel({
  selected,
  properties,
  onChange,
  onSave,
  onPublish,
  onReset,
  onUndo,
  onRedo,
  onDuplicate,
  onToggleHidden,
  onToggleLocked,
  onAlign,
  history,
  debugInfo,
  canUndo,
  canRedo,
}) {
  if (!selected) {
    return (
      <Panel elevated className="bds-designer-panel">
        <EmptyState title="Selecione um componente" description="Passe o mouse e clique em Header, Hero, TV, Chat, Futebol, Noticias, Radio, Comunidade, BarStudio ou Footer." />
      </Panel>
    )
  }

  const set = (key) => (value) => onChange({ ...properties, [key]: value })

  return (
    <Panel elevated className="bds-designer-panel">
      <SectionHeader eyebrow="Componente selecionado" title={selected.label} subtitle={selected.id} />

      <div className="bds-designer-actions">
        <ActionButton variant="outline" icon={<Undo2 size={16} />} disabled={!canUndo} onClick={onUndo}>Desfazer</ActionButton>
        <ActionButton variant="outline" icon={<Redo2 size={16} />} disabled={!canRedo} onClick={onRedo}>Refazer</ActionButton>
      </div>

      <PropertyGroup title="Layout">
        <PropertyInput label="Posicao X" type="number" value={properties.x} onChange={set('x')} />
        <PropertyInput label="Posicao Y" type="number" value={properties.y} onChange={set('y')} />
        <PropertyInput label="Largura" value={properties.width} onChange={set('width')} />
        <PropertyInput label="Altura" value={properties.height} onChange={set('height')} />
        <PropertyInput label="Gap" value={properties.gap} onChange={set('gap')} />
        <PropertyInput label="Align" value={properties.alignItems} onChange={set('alignItems')} />
        <PropertyInput label="Justify" value={properties.justifyContent} onChange={set('justifyContent')} />
        <PropertyInput label="Display" value={properties.display} onChange={set('display')} />
        <PropertyInput label="Max width" value={properties.maxWidth} onChange={set('maxWidth')} />
        <PropertyInput label="Min width" value={properties.minWidth} onChange={set('minWidth')} />
      </PropertyGroup>

      <PropertyGroup title="Espacamento">
        <PropertyInput label="Padding" value={properties.padding} onChange={set('padding')} />
        <PropertyInput label="Margin" value={properties.margin} onChange={set('margin')} />
      </PropertyGroup>

      <PropertyGroup title="Tipografia">
        <PropertyInput label="Font size" value={properties.fontSize} onChange={set('fontSize')} />
        <PropertyInput label="Font weight" value={properties.fontWeight} onChange={set('fontWeight')} />
        <PropertyInput label="Line height" value={properties.lineHeight} onChange={set('lineHeight')} />
        <PropertyInput label="Letter spacing" value={properties.letterSpacing} onChange={set('letterSpacing')} />
        <PropertyInput label="Icon size" value={properties.iconSize} onChange={set('iconSize')} />
      </PropertyGroup>

      <PropertyGroup title="Cores">
        <PropertyInput label="Background" value={properties.backgroundColor} onChange={set('backgroundColor')} />
        <PropertyInput label="Text color" value={properties.color} onChange={set('color')} />
      </PropertyGroup>

      <PropertyGroup title="Bordas e sombras">
        <PropertyInput label="Radius" value={properties.borderRadius} onChange={set('borderRadius')} />
        <PropertyInput label="Border" value={properties.border} onChange={set('border')} />
        <PropertyInput label="Shadow" value={properties.boxShadow} onChange={set('boxShadow')} />
      </PropertyGroup>

      <PropertyGroup title="Transformacoes">
        <PropertyInput label="Opacity" value={properties.opacity} onChange={set('opacity')} />
      </PropertyGroup>

      <div className="bds-designer-actions">
        <ActionButton variant="outline" onClick={() => onAlign('left')}>Esquerda</ActionButton>
        <ActionButton variant="outline" onClick={() => onAlign('center')}>Centro</ActionButton>
        <ActionButton variant="outline" onClick={() => onAlign('right')}>Direita</ActionButton>
        <ActionButton variant="outline" onClick={() => onAlign('top')}>Topo</ActionButton>
        <ActionButton variant="outline" onClick={() => onAlign('middle')}>Meio</ActionButton>
        <ActionButton variant="outline" onClick={() => onAlign('bottom')}>Base</ActionButton>
        <ActionButton variant="outline" onClick={() => onAlign('space-between')}>Distribuir H</ActionButton>
        <ActionButton variant="outline" onClick={() => onAlign('space-around')}>Distribuir V</ActionButton>
      </div>

      <div className="bds-designer-actions">
        <ActionButton variant="outline" onClick={onDuplicate}>Duplicar</ActionButton>
        <ActionButton variant="outline" onClick={onToggleHidden}>{properties.visibility === 'hidden' ? 'Mostrar' : 'Ocultar'}</ActionButton>
        <ActionButton variant="outline" onClick={onToggleLocked}>{properties.locked ? 'Desbloquear' : 'Bloquear'}</ActionButton>
      </div>

      <div className="bds-designer-actions">
        <ActionButton icon={<Save size={16} />} onClick={onSave}>Salvar</ActionButton>
        <ActionButton variant="secondary" icon={<Send size={16} />} onClick={onPublish}>Publicar</ActionButton>
        <ActionButton variant="danger" icon={<RotateCcw size={16} />} onClick={onReset}>Resetar</ActionButton>
      </div>

      <section className="bds-designer-history">
        <h3>Historico</h3>
        {history.length ? history.slice(-6).reverse().map((entry, index) => (
          <div key={index}>Alteracao {history.length - index}</div>
        )) : <span>Nenhuma alteracao ainda.</span>}
      </section>

      <section className="bds-designer-inspector">
        <h3>Inspecao Runtime</h3>
        <dl>
          <div><dt>Componente</dt><dd>{selected.label}</dd></div>
          <div><dt>ID</dt><dd>{selected.id}</dd></div>
          <div><dt>Origem</dt><dd>{debugInfo?.origin || 'draft-local'}</dd></div>
        </dl>
        <details>
          <summary>Layout aplicado</summary>
          <pre>{JSON.stringify(debugInfo?.appliedLayout || properties, null, 2)}</pre>
        </details>
        <details>
          <summary>Publicado</summary>
          <pre>{JSON.stringify(debugInfo?.publishedLayout || {}, null, 2)}</pre>
        </details>
        <details>
          <summary>Draft</summary>
          <pre>{JSON.stringify(debugInfo?.draftLayout || properties, null, 2)}</pre>
        </details>
      </section>
    </Panel>
  )
}

export default function DesignerPage() {
  const runtime = useDesignerRuntime()
  const setPreviewDraft = runtime?.setPreviewDraft
  const setRuntimeDraftLayouts = runtime?.setRuntimeDraftLayouts
  const [access, setAccess] = useState({ loading: true, allowed: false, reason: '' })
  const [selected, setSelected] = useState(null)
  const [settings, setSettings] = useState({})
  const [device, setDevice] = useState('desktop')
  const [selectionMode, setSelectionMode] = useState('section')
  const [layoutName, setLayoutName] = useState(LAYOUT_THEMES[0])
  const [grid, setGrid] = useState(true)
  const [preview, setPreview] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [selectionBox, setSelectionBox] = useState(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)

  const selectedProperties = useMemo(() => ({
    ...DEFAULT_PROPS,
    ...(selected ? settings[selected.id] : {}),
  }), [selected, settings])
  const layoutPage = layoutName === LAYOUT_THEMES[0] ? 'home' : `home:${layoutName}`
  const selectedDebugInfo = selected ? runtime?.getLayout(selected.id, { page: layoutPage, device, previewDraft: true }) : null

  function selectDesignerTarget(nextSelected) {
    if (!nextSelected?.id) return
    setSelected(nextSelected)
    document.querySelectorAll('.bds-designer-selected').forEach((item) => item.classList.remove('bds-designer-selected'))
    const element = getElement(nextSelected.id)
    if (element) element.classList.add('bds-designer-selected')
  }

  useEffect(() => {
    let active = true
    getDesignerUserAccess().then((result) => {
      if (active) setAccess({ loading: false, ...result })
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!access.allowed) return
    listLayoutSettings({ page: layoutPage, device, status: 'draft' }).then((result) => {
      const nextSettings = {}
      ;(result.data || []).forEach((item) => {
        nextSettings[item.component] = item.properties || {}
      })
      setSettings(nextSettings)
    })
  }, [access.allowed, device, layoutPage])

  useEffect(() => {
    if (!access.allowed) return
    document.body.classList.toggle('bds-designer-active', !preview)
    document.body.classList.toggle('bds-designer-preview', preview)
    setPreviewDraft?.(true)
    return () => {
      document.body.classList.remove('bds-designer-active', 'bds-designer-preview')
      setPreviewDraft?.(false)
    }
  }, [access.allowed, preview, setPreviewDraft])

  useEffect(() => {
    if (!access.allowed) return
    setRuntimeDraftLayouts?.(settings, { page: layoutPage, device })
  }, [access.allowed, device, layoutPage, setRuntimeDraftLayouts, settings])

  useEffect(() => {
    if (!access.allowed) return
    Object.entries(settings).forEach(([id, properties]) => {
      const element = getElement(id)
      if (element) Object.assign(element.style, buildInlineStyle(properties))
    })
  }, [settings, access.allowed])

  useEffect(() => {
    if (!selected || preview) {
      setSelectionBox(null)
      return undefined
    }

    function updateSelectionBox() {
      const element = getElement(selected.id)
      const canvas = canvasRef.current
      if (!element || !canvas) {
        setSelectionBox(null)
        return
      }
      const elementRect = element.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()
      setSelectionBox({
        x: elementRect.left - canvasRect.left + canvas.scrollLeft,
        y: elementRect.top - canvasRect.top + canvas.scrollTop,
        width: elementRect.width,
        height: elementRect.height,
      })
    }

    updateSelectionBox()
    window.addEventListener('resize', updateSelectionBox)
    window.addEventListener('scroll', updateSelectionBox, true)
    return () => {
      window.removeEventListener('resize', updateSelectionBox)
      window.removeEventListener('scroll', updateSelectionBox, true)
    }
  }, [selected, settings, preview])

  useEffect(() => {
    if (!access.allowed || preview) return undefined

    function selectableFromEvent(event) {
      let element = event.target.closest?.('[data-designer-id]')
      while (element) {
        const id = element.dataset.designerId || ''
        const isElement = id.includes('.')
        if ((selectionMode === 'element' && isElement) || (selectionMode === 'section' && !isElement)) return element
        element = element.parentElement?.closest?.('[data-designer-id]')
      }
      return null
    }

    function onMouseOver(event) {
      const element = selectableFromEvent(event)
      document.querySelectorAll('.bds-designer-hover').forEach((item) => item.classList.remove('bds-designer-hover'))
      if (element) element.classList.add('bds-designer-hover')
    }

    function onClick(event) {
      const element = selectableFromEvent(event)
      if (!element) return
      event.preventDefault()
      event.stopPropagation()
      selectDesignerTarget({ id: element.dataset.designerId, label: element.dataset.designerLabel || element.dataset.designerId })
    }

    function onMouseDown(event) {
      const element = selectableFromEvent(event)
      if (!element || event.target.closest('.bds-designer-panel')) return
      const id = element.dataset.designerId
      if (!id || selected?.id !== id || selectedProperties.locked) return
      dragRef.current = {
        id,
        startX: event.clientX,
        startY: event.clientY,
        initial: settings[id] || DEFAULT_PROPS,
        mode: event.altKey ? 'resize' : 'move',
      }
    }

    function onMouseMove(event) {
      if (!dragRef.current) return
      const { id, startX, startY, initial, mode } = dragRef.current
      const dx = Math.round(event.clientX - startX)
      const dy = Math.round(event.clientY - startY)
      const snap = (value) => Math.round(value / 8) * 8
      const next = mode === 'resize'
        ? { ...initial, width: Math.max(120, Number.parseInt(initial.width || getElement(id)?.offsetWidth || 0, 10) + snap(dx)), height: Math.max(80, Number.parseInt(initial.height || getElement(id)?.offsetHeight || 0, 10) + snap(dy)) }
        : { ...initial, x: snap(Number(initial.x || 0) + dx), y: snap(Number(initial.y || 0) + dy) }
      setSettings((current) => ({ ...current, [id]: next }))
    }

    function onMouseUp() {
      if (dragRef.current) {
        setHistory((current) => [...current, settings])
        setFuture([])
      }
      dragRef.current = null
    }

    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('click', onClick, true)
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('mousedown', onMouseDown, true)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [access.allowed, preview, selected, selectedProperties.locked, selectionMode, settings])

  function updateSelected(properties) {
    if (!selected) return
    setHistory((current) => [...current, settings])
    setFuture([])
    setSettings((current) => ({ ...current, [selected.id]: properties }))
  }

  async function save(status = 'draft') {
    if (!selected) return
    const result = await saveLayoutSetting({ page: layoutPage, component: selected.id, device, properties: selectedProperties, status })
    setMessage(result.error ? result.error.message : status === 'published' ? 'Layout publicado.' : 'Layout salvo.')
  }

  async function saveAll(status = 'draft') {
    const entries = Object.entries(settings)
    if (!entries.length) {
      setMessage('Nenhuma alteracao para salvar.')
      return
    }
    const results = await Promise.all(entries.map(([component, properties]) => (
      saveLayoutSetting({ page: layoutPage, component, device, properties, status })
    )))
    const failed = results.find((result) => result.error)
    setMessage(failed?.error ? failed.error.message : status === 'published' ? 'Layout completo publicado.' : 'Layout completo salvo.')
  }

  async function reset() {
    if (!selected) return
    await resetLayoutSetting({ page: layoutPage, component: selected.id, device })
    setSettings((current) => ({ ...current, [selected.id]: {} }))
    const element = getElement(selected.id)
    if (element) element.removeAttribute('style')
    setMessage('Layout original restaurado para o componente.')
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setFuture((current) => [settings, ...current])
    setHistory((current) => current.slice(0, -1))
    setSettings(previous)
  }

  function redo() {
    const next = future[0]
    if (!next) return
    setHistory((current) => [...current, settings])
    setFuture((current) => current.slice(1))
    setSettings(next)
  }

  function startResize(event) {
    if (!selected) return
    event.preventDefault()
    event.stopPropagation()
    const element = getElement(selected.id)
    dragRef.current = {
      id: selected.id,
      startX: event.clientX,
      startY: event.clientY,
      initial: {
        ...selectedProperties,
        width: selectedProperties.width || element?.offsetWidth || '',
        height: selectedProperties.height || element?.offsetHeight || '',
      },
      mode: 'resize',
    }
  }

  function alignSelected(mode) {
    if (!selected) return
    const next = { ...selectedProperties }
    if (mode === 'left') next.justifyContent = 'flex-start'
    if (mode === 'center') next.justifyContent = 'center'
    if (mode === 'right') next.justifyContent = 'flex-end'
    if (mode === 'top') next.alignItems = 'flex-start'
    if (mode === 'middle') next.alignItems = 'center'
    if (mode === 'bottom') next.alignItems = 'flex-end'
    if (mode === 'space-between') next.justifyContent = 'space-between'
    if (mode === 'space-around') next.alignItems = 'space-around'
    updateSelected(next)
  }

  function duplicateSelected() {
    if (!selected) return
    const element = getElement(selected.id)
    if (!element?.parentElement) return
    const clone = element.cloneNode(true)
    const duplicateId = `${selected.id}.duplicate.${Date.now()}`
    clone.dataset.designerId = duplicateId
    clone.dataset.designerLabel = `${selected.label} / Copia`
    clone.classList.remove('bds-designer-hover', 'bds-designer-selected')
    element.parentElement.insertBefore(clone, element.nextSibling)
    setSettings((current) => ({ ...current, [duplicateId]: { ...selectedProperties, x: Number(selectedProperties.x || 0) + 16, y: Number(selectedProperties.y || 0) + 16 } }))
    selectDesignerTarget({ id: duplicateId, label: `${selected.label} / Copia` })
    setMessage('Elemento duplicado no canvas do Designer.')
  }

  function toggleHidden() {
    updateSelected({ ...selectedProperties, visibility: selectedProperties.visibility === 'hidden' ? '' : 'hidden' })
  }

  function toggleLocked() {
    updateSelected({ ...selectedProperties, locked: !selectedProperties.locked })
  }

  function exportLayout() {
    const payload = {
      version: 'barstudio-designer-pro-v2',
      layout: layoutName,
      page: layoutPage,
      device,
      settings,
    }
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2))
    setMessage('Layout exportado em JSON para a area de transferencia.')
  }

  function importLayout() {
    const json = window.prompt('Cole o JSON do layout')
    if (!json) return
    try {
      const payload = JSON.parse(json)
      setHistory((current) => [...current, settings])
      setFuture([])
      setSettings(payload.settings || {})
      setMessage('Layout importado no canvas. Use Salvar ou Publicar para persistir.')
    } catch (error) {
      setMessage(`JSON invalido: ${error.message}`)
    }
  }

  if (access.loading) return <Loading label="Verificando acesso ao Designer" />
  if (!access.allowed) return <ErrorState title="Designer restrito" description={access.reason} />

  return (
    <main className={`bds-designer-page bds-designer-page--${device}`}>
      <div className="bds-designer-toolbar">
        <StatusBadge status="MODO DESIGNER">MODO DESIGNER</StatusBadge>
        <div className="bds-designer-toolbar__group">
          {MODES.map((item) => (
            <ActionButton key={item.id} variant={selectionMode === item.id ? 'primary' : 'outline'} onClick={() => setSelectionMode(item.id)}>
              {item.label}
            </ActionButton>
          ))}
        </div>
        <label className="bds-designer-select">
          <span>Layout</span>
          <select value={layoutName} onChange={(event) => setLayoutName(event.target.value)}>
            {LAYOUT_THEMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
          </select>
        </label>
        <div className="bds-designer-toolbar__group">
          {DEVICES.map((item) => (
            <ActionButton key={item} variant={device === item ? 'primary' : 'outline'} onClick={() => setDevice(item)}>
              {item}
            </ActionButton>
          ))}
        </div>
        <ActionButton variant="outline" icon={<Grid2X2 size={16} />} onClick={() => setGrid((value) => !value)}>
          {grid ? 'Ocultar Grid' : 'Mostrar Grid'}
        </ActionButton>
        <ActionButton variant="outline" icon={preview ? <EyeOff size={16} /> : <Eye size={16} />} onClick={() => setPreview((value) => !value)}>
          {preview ? 'Editar' : 'Visualizar'}
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => saveAll('draft')}>Salvar Layout</ActionButton>
        <ActionButton onClick={() => saveAll('published')}>Publicar Layout</ActionButton>
        <ActionButton variant="outline" onClick={exportLayout}>Exportar JSON</ActionButton>
        <ActionButton variant="outline" onClick={importLayout}>Importar JSON</ActionButton>
      </div>

      {message && <div className="bds-designer-message">{message}</div>}

      <section className={`bds-designer-workspace ${grid ? 'bds-designer-workspace--grid' : ''}`}>
        {!preview && <ComponentTree selected={selected} onSelect={selectDesignerTarget} />}

        <div className="bds-designer-canvas" ref={canvasRef}>
          <HomePage />
          <div className="bds-designer-guide bds-designer-guide--center-x" />
          <div className="bds-designer-guide bds-designer-guide--center-y" />
          {!preview && selectionBox && (
            <div
              className="bds-designer-selection-box"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height,
              }}
              aria-hidden="true"
            >
              <button className="bds-designer-resize-handle bds-designer-resize-handle--nw" type="button" onMouseDown={startResize} />
              <button className="bds-designer-resize-handle bds-designer-resize-handle--ne" type="button" onMouseDown={startResize} />
              <button className="bds-designer-resize-handle bds-designer-resize-handle--sw" type="button" onMouseDown={startResize} />
              <button className="bds-designer-resize-handle bds-designer-resize-handle--se" type="button" onMouseDown={startResize} />
            </div>
          )}
        </div>

        {!preview && (
          <DesignerPanel
            selected={selected}
            properties={selectedProperties}
            onChange={updateSelected}
            onSave={() => save('draft')}
            onPublish={() => save('published')}
            onReset={reset}
            onUndo={undo}
            onRedo={redo}
            onDuplicate={duplicateSelected}
            onToggleHidden={toggleHidden}
            onToggleLocked={toggleLocked}
            onAlign={alignSelected}
            history={history}
            debugInfo={selectedDebugInfo}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
          />
        )}
      </section>
    </main>
  )
}
