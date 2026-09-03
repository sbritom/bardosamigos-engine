import { memo } from 'react'
import { MessageCircle } from 'lucide-react'
import { ActionButton, FeatureCard } from '../../../design-system'
import '../../../design-system/styles/index.css'
import { XAT_CHAT_EMBED_URL, XAT_CHAT_PUBLIC_URL } from '../constants'

function OfficialChatComponent({ fullscreen = false }) {
  return (
    <FeatureCard
      className={fullscreen ? 'bds-home-card-full' : 'bds-home-card-full imortal-home-media-card imortal-home-chat-card'}
      title={fullscreen ? 'Xat Oficial IMORTAL0800' : 'Xat Oficial'}
      icon={<MessageCircle size={20} />}
      action={(
        <div className="bds-chat-actions">
          <ActionButton onClick={() => window.open(XAT_CHAT_PUBLIC_URL, '_blank', 'noopener,noreferrer')}>
            Abrir Xat
          </ActionButton>
          {!fullscreen && (
            <ActionButton variant="secondary" onClick={() => window.open('/chat', '_blank', 'noopener,noreferrer')}>
              Tela cheia
            </ActionButton>
          )}
        </div>
      )}
    >
      <div className={fullscreen ? 'bds-chat-frame bds-chat-frame--fullscreen' : 'bds-chat-frame'} data-designer-id="chat.iframe" data-designer-label="Chat / Iframe">
        <iframe
          title="Chat Oficial IMORTAL0800"
          src={XAT_CHAT_EMBED_URL}
          allow="clipboard-write"
          width="540"
          height="405"
          frameBorder="0"
          scrolling="no"
          loading="lazy"
        />
      </div>
    </FeatureCard>
  )
}

export const OfficialChat = memo(OfficialChatComponent)
