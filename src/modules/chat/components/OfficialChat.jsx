import { memo } from 'react'
import { Button, Card } from '../../../design-system'
import { XAT_CHAT_EMBED_URL, XAT_CHAT_PUBLIC_URL } from '../constants'

function OfficialChatComponent({ fullscreen = false }) {
  return (
    <Card className={`overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] shadow-xl ${fullscreen ? 'min-h-[calc(100vh-220px)]' : ''}`}>
      <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-black p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--gold)]">💬 Chat Oficial Bar dos Amigos</h2>
          <p className="text-sm font-semibold text-[var(--secondary)]">Comunidade Oficial</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold text-[var(--success)]">
            🟢 Online
          </span>
          <Button onClick={() => window.open(XAT_CHAT_PUBLIC_URL, '_blank', 'noopener,noreferrer')}>
            💬 Abrir no xat
          </Button>
          {!fullscreen && (
            <Button variant="secondary" onClick={() => window.open('/chat', '_blank', 'noopener,noreferrer')}>
              🖥 Tela Cheia
            </Button>
          )}
        </div>
      </div>

      <div className={fullscreen ? 'h-[calc(100vh-320px)] min-h-[640px] bg-black p-3' : 'h-[640px] bg-black p-3'}>
        <iframe
          title="Chat Oficial Bar dos Amigos"
          src={XAT_CHAT_EMBED_URL}
          allow="clipboard-write"
          width="480"
          height="640"
          frameBorder="0"
          scrolling="no"
          loading="lazy"
          className="h-full w-full rounded-lg border-0 bg-black"
        />
      </div>
    </Card>
  )
}

export const OfficialChat = memo(OfficialChatComponent)
