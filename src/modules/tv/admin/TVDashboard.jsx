import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  FolderKanban,
  ImageOff,
  Plus,
  RadioTower,
  ShieldCheck,
  Star,
  Tv,
  TvMinimal,
} from 'lucide-react'
import { ActionButton, DashboardGrid, ErrorState, LoadingSkeleton, StatCard } from '../../../design-system'
import { TVChannelService } from '../services'

const initialMetrics = {
  totalCategories: 0,
  activeCategories: 0,
  totalChannels: 0,
  activeChannels: 0,
  inactiveChannels: 0,
  featuredChannels: 0,
  verifiedChannels: 0,
  channelsWithoutLogo: 0,
  channelsWithoutCategory: 0,
  totalViews: 0,
}

export function TVDashboard({ navigateTo }) {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const response = await TVChannelService.getDashboardMetrics()
    setMetrics(response.data || initialMetrics)
    setError(response.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingSkeleton rows={8} />
  if (error) {
    return <ErrorState title="Nao foi possivel carregar o Dashboard" description={error.message} actionLabel="Tentar novamente" onAction={load} />
  }

  const cards = [
    ['Categorias', metrics.totalCategories, `${metrics.activeCategories} ativas`, FolderKanban],
    ['Canais', metrics.totalChannels, `${metrics.activeChannels} ativos`, Tv],
    ['Inativos', metrics.inactiveChannels, 'fora do catalogo publico', TvMinimal],
    ['Destaques', metrics.featuredChannels, 'posicoes editoriais', Star],
    ['Verificados', metrics.verifiedChannels, 'revisados pela equipe', ShieldCheck],
    ['Sem logo', metrics.channelsWithoutLogo, 'precisam de identidade', ImageOff],
    ['Sem categoria', metrics.channelsWithoutCategory, 'precisam de organizacao', RadioTower],
    ['Visualizacoes', metrics.totalViews.toLocaleString('pt-BR'), 'acumuladas', Eye],
  ]

  return (
    <div className="tv-admin-dashboard">
      <DashboardGrid columns={12}>
        {cards.map(([label, value, hint, Icon]) => (
          <StatCard key={label} label={label} value={value} hint={hint} icon={<Icon size={20} />} />
        ))}
      </DashboardGrid>
      <div className="tv-admin-shortcuts">
        <ActionButton icon={<Plus size={17} />} onClick={() => navigateTo('channels', { create: true })}>Novo canal</ActionButton>
        <ActionButton icon={<Plus size={17} />} variant="outline" onClick={() => navigateTo('categories', { create: true })}>Nova categoria</ActionButton>
        <ActionButton icon={<Tv size={17} />} variant="outline" onClick={() => navigateTo('channels')}>Gerenciar canais</ActionButton>
        <ActionButton icon={<FolderKanban size={17} />} variant="outline" onClick={() => navigateTo('categories')}>Gerenciar categorias</ActionButton>
        <ActionButton icon={<Star size={17} />} variant="outline" onClick={() => navigateTo('featured')}>Destaques</ActionButton>
        <ActionButton icon={<CheckCircle2 size={17} />} variant="ghost" disabled>Importar canais - Em breve</ActionButton>
      </div>
    </div>
  )
}
