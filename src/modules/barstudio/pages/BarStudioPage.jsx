import { useState } from 'react'
import { Image, Palette, Paintbrush, Pipette, RefreshCw, Scissors, Sparkles, UserCircle } from 'lucide-react'
import { PortalWorkspace, WorkspaceEmptyState } from '../../../shared/workspace'
import { StorageContextProvider } from '../storage'
import CropTool from './tools/crop/CropTool'
import RemoveBackgroundTool from './tools/remove-background/RemoveBackgroundTool'
import AvatarTool from './tools/avatar/AvatarTool'
import ConvertImageTool from './tools/convert/ConvertImageTool'
import GradientsTool from './tools/gradients/GradientsTool'
import ExtractColorsTool from './tools/extract-colors/ExtractColorsTool'
import PalettesTool from './tools/palettes/PalettesTool'

const sidebarSections = [
  {
    title: 'Imagens',
    tools: [
      { id: 'crop', title: 'Cortar Foto Redonda', icon: Scissors, available: true },
      { id: 'remove-background', title: 'Remover Fundo', icon: Paintbrush, available: true },
      { id: 'avatar', title: 'Avatar Studio', icon: UserCircle, available: true },
      { id: 'convert', title: 'Converter Imagem', icon: RefreshCw, available: true },
    ],
  },
  {
    title: 'Cores',
    tools: [
      { id: 'color-generator', title: 'Gerador de Cores', icon: Sparkles, available: true },
      { id: 'extract-colors', title: 'Extrair Cores', icon: Pipette, available: true },
      { id: 'palettes', title: 'Paletas', icon: Palette, available: true },
    ],
  },
]

const upcomingTools = [
  { id: 'resize', title: 'Redimensionar', icon: Image },
]

const availableTools = sidebarSections.flatMap((section) =>
  section.tools.map((tool) => ({ ...tool, section: section.title })),
)

const sidebarItems = [
  { id: 'group-images', name: 'Imagens', groupLabel: true },
  ...sidebarSections[0].tools.map((tool) => ({ id: tool.id, icon: tool.icon, name: tool.title })),
  { id: 'group-colors', name: 'Cores', groupLabel: true },
  ...sidebarSections[1].tools.map((tool) => ({ id: tool.id, icon: tool.icon, name: tool.title })),
  { id: 'group-upcoming', name: 'Em breve', groupLabel: true },
  ...upcomingTools.map((tool) => ({ id: tool.id, icon: tool.icon, name: tool.title, badge: 'Em breve', disabled: true })),
]

function ToolPlaceholder({ tool }) {
  return <WorkspaceEmptyState icon={tool.icon} title={tool.title} description="Esta ferramenta sera implementada em uma proxima atualizacao." />
}

export default function BarStudioPage() {
  const [activeToolId, setActiveToolId] = useState('')
  const activeTool = availableTools.find((tool) => tool.id === activeToolId) || null

  return (
    <StorageContextProvider>
      <PortalWorkspace
        className="bds-portal-workspace--compact bds-barstudio-workspace"
        header={{ eyebrow: 'Ferramentas criativas', title: 'BarStudio', description: 'Central criativa do Bar dos Amigos.', className: 'bds-barstudio-header' }}
        sidebar={{ title: '', ariaLabel: 'Ferramentas do BarStudio', className: 'bds-barstudio-sidebar', items: sidebarItems, selectedId: activeToolId, onSelect: (item) => setActiveToolId(item.id) }}
        content={activeTool ? {} : { title: 'Ferramentas', description: 'Selecione uma ferramenta na barra lateral para comecar.' }}
      >
        {activeTool?.id === 'crop' ? <CropTool />
          : activeTool?.id === 'remove-background' ? <RemoveBackgroundTool />
            : activeTool?.id === 'avatar' ? <AvatarTool />
              : activeTool?.id === 'convert' ? <ConvertImageTool />
                : activeTool?.id === 'color-generator' ? <GradientsTool />
                  : activeTool?.id === 'extract-colors' ? <ExtractColorsTool />
                    : activeTool?.id === 'palettes' ? <PalettesTool />
                      : activeTool ? <ToolPlaceholder tool={activeTool} />
                        : <WorkspaceEmptyState icon={Sparkles} title="Bem-vindo ao BarStudio" description="Selecione uma ferramenta na barra lateral para comecar." />}
      </PortalWorkspace>
    </StorageContextProvider>
  )
}
