import { Heart, Music2, Play, Star, Trophy, Tv } from 'lucide-react'
import { ActionButton, EmptyState, FeatureCard, HeroCard, SectionHeader, StatCard, StatusBadge } from '../../../design-system'

const categories = [
  ['Canal principal', 'Transmissao oficial do Bar dos Amigos.', Tv, 'PRONTA'],
  ['Futebol', 'Jogos e eventos esportivos quando houver embed permitido.', Trophy, 'PREPARADO'],
  ['Musica', 'Conteudos musicais e lives liberadas.', Music2, 'PREPARADO'],
  ['Eventos', 'Coberturas especiais da comunidade.', Star, 'PREPARADO'],
]

export default function TVPage() {
  return (
    <main className="bds-release-page">
      <HeroCard
        className="bds-release-hero"
        eyebrow="TV Bar dos Amigos"
        title="Central de transmissao"
        subtitle="Player, categorias e favoritos preparados para embeds permitidos. YouTube permanece preservado via VITE_YOUTUBE_API_KEY."
        action={<ActionButton icon={<Play size={18} />}>Assistir canal principal</ActionButton>}
        secondaryAction={<ActionButton variant="outline" icon={<Heart size={18} />}>Favoritos</ActionButton>}
      />

      <section className="bds-release-section">
        <SectionHeader eyebrow="Canais" title="Categorias" subtitle="Nenhum bloqueio de iframe sera burlado; somente embeds permitidos entram aqui." />
        <div className="bds-release-grid bds-release-grid--four">
          {categories.map(([title, description, Icon, status]) => (
            <FeatureCard key={title} icon={<Icon size={20} />} eyebrow={status} title={title} description={description} action={<StatusBadge status={status}>{status}</StatusBadge>}>
              <ActionButton variant="outline">Abrir</ActionButton>
            </FeatureCard>
          ))}
        </div>
      </section>

      <section className="bds-release-grid bds-release-grid--two">
        <FeatureCard icon={<Tv size={20} />} eyebrow="Player" title="Canal principal" description="Estado pronto para transmissao ao vivo.">
          <div className="bds-release-player">
            <Play size={42} />
            <strong>TV AO VIVO</strong>
            <span>Sem transmissao ativa no momento.</span>
          </div>
        </FeatureCard>
        <FeatureCard icon={<Star size={20} />} eyebrow="Plex futuro" title="Biblioteca preparada" description="Espaco reservado para integracoes futuras quando possivel.">
          <EmptyState title="Nenhum conteudo fixo" description="Quando houver midia autorizada, ela aparecera aqui com estado seguro." />
        </FeatureCard>
      </section>

      <div className="bds-release-grid bds-release-grid--three">
        <StatCard label="Categorias" value="4" hint="principal, futebol, musica e eventos" />
        <StatCard label="YouTube" value="Ativo" hint="chave preservada no ambiente" />
        <StatCard label="Favoritos" value="Preparado" hint="pronto para usuario logado" />
      </div>
    </main>
  )
}
