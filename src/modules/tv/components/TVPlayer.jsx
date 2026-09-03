import { AlertTriangle, Globe2, Tv } from 'lucide-react'
import { Panel } from '../../../design-system'
import { resolveTVEmbedProvider } from '../providers'
import { TVEmptyState } from './TVEmptyState'

export function TVPlayer({
  embed_url: embedUrl,
  title,
  poster,
  provider = 'iframe',
  blockedByRegion = false,
  regionCheckPending = false,
  viewerCountry = '',
}) {
  const renderProvider = resolveTVEmbedProvider(provider)
  const content = !regionCheckPending && !blockedByRegion && embedUrl && renderProvider
    ? renderProvider({ embedUrl, title, poster })
    : null

  const emptyState = regionCheckPending
    ? {
        icon: <Globe2 size={32} />,
        title: 'Verificando disponibilidade',
        description: 'Estamos identificando sua região antes de iniciar a transmissão.',
      }
    : blockedByRegion
      ? {
          icon: <Globe2 size={32} />,
          title: 'Canal indisponível nesta região',
          description: viewerCountry
            ? `Esta fonte libera a transmissão somente no Brasil. Seu acesso foi identificado como ${viewerCountry}. Escolha um canal Global para assistir.`
            : 'Esta fonte libera a transmissão somente no Brasil. Escolha um canal Global para assistir.',
        }
      : {
          icon: embedUrl ? <AlertTriangle size={30} /> : <Tv size={32} />,
          title: embedUrl ? 'Provedor indisponível' : 'Nenhum canal selecionado',
          description: embedUrl
            ? 'A fonte deste canal não possui um adaptador de reprodução compatível.'
            : 'Escolha um canal publicado para iniciar a transmissão.',
        }

  return (
    <Panel className="tv-player">
      <div className="tv-player__viewport" style={poster ? { backgroundImage: `url("${poster}")` } : undefined}>
        {content || <TVEmptyState {...emptyState} />}
      </div>
      {title && <div className="tv-player__title"><span>AGORA</span><strong>{title}</strong></div>}
    </Panel>
  )
}
