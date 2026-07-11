import { FolderKanban, Import, LayoutDashboard, Settings, Star, Tv } from 'lucide-react'

export const TV_ADMIN_SECTIONS = Object.freeze([
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/tv' },
  { id: 'categories', label: 'Categorias', icon: FolderKanban, path: '/admin/tv/categories' },
  { id: 'channels', label: 'Canais', icon: Tv, path: '/admin/tv/channels' },
  { id: 'featured', label: 'Destaques', icon: Star, path: '/admin/tv/featured' },
  { id: 'settings', label: 'Configuracoes', icon: Settings, path: '/admin/tv/settings' },
  { id: 'import', label: 'Importacao', icon: Import, path: '/admin/tv/import', upcoming: true },
])
