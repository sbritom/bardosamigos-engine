import { AlertTriangle, Tv } from 'lucide-react'
import { Panel } from '../../../design-system'
import { resolveTVEmbedProvider } from '../providers'
import { TVEmptyState } from './TVEmptyState'

export function TVPlayer({ embed_url: embedUrl, title, poster, provider = 'iframe' }) {
  const renderProvider = resolveTVEmbedProvider(provider)
  const content = embedUrl && renderProvider ? renderProvider({ embedUrl, title, poster }) : null

  return (
    <Panel className="tv-player">
      <div className="tv-player__viewport" style={poster ? { backgroundImage: `url("${poster}")` } : undefined}>
        {content || (
          <TVEmptyState
            icon={embedUrl ? <AlertTriangle size={30} /> : <Tv size={32} />}
            title={embedUrl ? 'Provedor indisponivel' : 'Nenhum canal selecionado'}
            description={embedUrl
              ? 'Este provedor ainda nao possui um adaptador de reproducao.'
              : 'Escolha um canal publicado para iniciar a transmissao.'}
          />
        )}
      </div>
      {title && <div className="tv-player__title"><span>AGORA</span><strong>{title}</strong></div>}
    </Panel>
  )
}
