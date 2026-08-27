import { ExternalLink } from 'lucide-react'
import { Alert, Modal, StatusBadge } from '../../../design-system'
import { TVPlayer } from '../components'
import { normalizeTVEmbedUrl } from '../utils'

export function TVChannelPreview({ channel, open, onClose }) {
  const normalized = normalizeTVEmbedUrl(channel?.embedUrl)
  return (
    <Modal open={open} title="Testar canal" onClose={onClose} className="tv-admin-preview-modal">
      <div className="tv-admin-preview">
        <div className="tv-admin-preview__header">
          <div>
            <strong>{channel?.name || 'Canal sem nome'}</strong>
            <span>{channel?.provider || 'Outro'}</span>
          </div>
          <StatusBadge status={normalized.valid ? 'PRONTO' : 'INVALIDO'}>
            {normalized.valid ? 'PRONTO PARA TESTE' : 'URL INVALIDA'}
          </StatusBadge>
        </div>
        <code>{normalized.url || channel?.embedUrl || 'URL nao informada'}</code>
        {normalized.valid ? (
          <>
            <TVPlayer
              embed_url={normalized.url}
              title={channel?.name}
              poster={channel?.logo}
              provider={channel?.provider}
            />
            <Alert status="info" title="Teste isolado">
              O carregamento visual nao garante disponibilidade permanente. Alguns provedores bloqueiam incorporacao.
            </Alert>
          </>
        ) : (
          <Alert status="error" title="Nao foi possivel testar">{normalized.error}</Alert>
        )}
        {normalized.valid && (
          <a href={normalized.url} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Abrir URL em nova aba
          </a>
        )}
      </div>
    </Modal>
  )
}
