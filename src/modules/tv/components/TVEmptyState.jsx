import { Tv } from 'lucide-react'
import { EmptyState } from '../../../design-system'

export function TVEmptyState({
  title = 'A programacao chega em breve',
  description = 'A TV Platform esta pronta para receber canais publicados pelo time do Bar dos Amigos.',
  icon = <Tv size={32} aria-hidden="true" />,
}) {
  return <EmptyState icon={icon} title={title} description={description} />
}
