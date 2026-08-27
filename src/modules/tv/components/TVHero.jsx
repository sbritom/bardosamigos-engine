import { Play, Tv } from 'lucide-react'
import { ActionButton, Badge } from '../../../design-system'

export function TVHero({ featured, onWatch }) {
  const channel = featured?.channel
  return (
    <section className="tv-hero" aria-labelledby="tv-platform-title">
      <div className="tv-hero__signal"><Tv size={22} aria-hidden="true" /> TV BAR DOS AMIGOS</div>
      <h1 id="tv-platform-title">{channel?.name || 'Sua janela para o que acontece agora'}</h1>
      <p>
        {channel?.description
          || 'Uma plataforma preparada para transmissões, eventos e canais escolhidos pela nossa comunidade.'}
      </p>
      <div className="tv-hero__actions">
        {channel ? (
          <ActionButton icon={<Play size={18} />} onClick={() => onWatch(channel)}>
            Assistir agora
          </ActionButton>
        ) : (
          <Badge>PLATAFORMA PRONTA</Badge>
        )}
      </div>
    </section>
  )
}
