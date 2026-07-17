import { useState } from 'react'
import { Image, Palette, Paintbrush, Pipette, Scissors, Sparkles, UserCircle, Wand2 } from 'lucide-react'

import CropTool from './tools/crop/CropTool'

const sidebarSections = [
  {
    title: '🖼️ Imagens',
    tools: [
      { id: 'crop', title: 'Cortar Foto Redonda', icon: Scissors, available: true, marker: '🖼️' },
      { id: 'remove-background', title: 'Remover Fundo', icon: Paintbrush, available: true, marker: '🪄' },
    ],
  },
  {
    title: '🎨 Cores',
    tools: [
      { id: 'color-generator', title: 'Gerador de Cores', icon: Sparkles, available: true, marker: '🎨' },
    ],
  },
]


const availableTools = sidebarSections.flatMap((section) => section.tools)

const upcomingTools = [
  { title: 'Avatar', icon: UserCircle },
  { title: 'Paletas', icon: Palette },
  { title: 'Gradientes', icon: Wand2 },
  { title: 'Extrair Cores', icon: Pipette },
  { title: 'Redimensionar', icon: Image },
]

function BarStudioHeader() {
  return (
    <header className="bds-barstudio-app-header">
      <div>
        <strong>🍺 Bar Studio</strong>
        <span>Central criativa do Bar dos Amigos</span>
      </div>
      <label className="bds-barstudio-search">
        <span>Buscar ferramenta</span>
        <input aria-label="Buscar ferramenta" disabled placeholder="Buscar ferramenta" type="search" />
      </label>
    </header>
  )
}

function SidebarToolItem({ active = false, onSelect, tool, disabled = false }) {
  const Icon = tool.icon

  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={active ? 'bds-barstudio-sidebar-item is-active' : 'bds-barstudio-sidebar-item'}
      disabled={disabled}
      onClick={disabled ? undefined : onSelect}
      type="button"
    >
      <Icon size={16} />
      <span>{tool.title}</span>
    </button>
  )
}

function BarStudioSidebar({ activeToolId, onSelectTool }) {
  return (
    <aside className="bds-barstudio-sidebar" aria-label="Ferramentas do Bar Studio">
      <h2>Ferramentas</h2>
      {sidebarSections.map((section) => (
        <div className="bds-barstudio-sidebar-section" key={section.title}>
          <h3>{section.title}</h3>
          <div className="bds-barstudio-sidebar-list">
            {section.tools.map((tool) => (
              <SidebarToolItem
                active={activeToolId === tool.id}
                key={tool.id}
                onSelect={() => onSelectTool(tool.id)}
                tool={tool}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="bds-barstudio-sidebar-divider" />
      <div className="bds-barstudio-sidebar-section">
        <h3>Em breve</h3>
        <div className="bds-barstudio-sidebar-list">
          {upcomingTools.map((tool) => <SidebarToolItem disabled key={tool.title} tool={tool} />)}
        </div>
      </div>
    </aside>
  )
}

function EmptyWorkspace() {
  return (
    <div className="bds-barstudio-empty-workspace">
      <div className="bds-barstudio-empty-workspace__icon">🍺</div>
      <h1>Bem-vindo ao Bar Studio</h1>
      <p>Selecione uma ferramenta na barra lateral para começar.</p>
    </div>
  )
}

function ToolPlaceholder({ tool }) {
  return (
    <div className="bds-barstudio-tool-placeholder">
      <div className="bds-barstudio-tool-placeholder__icon">{tool.marker}</div>
      <h1>{tool.title}</h1>
      <p>Esta ferramenta será implementada na próxima sprint.</p>
    </div>
  )
}

function BarStudioWorkspace({ activeTool }) {
  const content = activeTool?.id === 'crop' ? <CropTool /> : null

  return (
    <section className="bds-barstudio-workspace" aria-label="Workspace do Bar Studio">
      {content || (activeTool ? <ToolPlaceholder tool={activeTool} /> : <EmptyWorkspace />)}
    </section>
  )
}

export default function BarStudioPage() {
  const [activeToolId, setActiveToolId] = useState('')
  const activeTool = availableTools.find((tool) => tool.id === activeToolId) || null

  return (
    <main className="bds-barstudio-app-shell">
      <BarStudioHeader />
      <div className="bds-barstudio-app-layout">
        <BarStudioSidebar activeToolId={activeToolId} onSelectTool={setActiveToolId} />
        <BarStudioWorkspace activeTool={activeTool} />
      </div>
    </main>
  )
}
