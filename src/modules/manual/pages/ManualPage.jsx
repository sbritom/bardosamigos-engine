import { BookOpen, MessageCircle, Radio, Shield, Trophy, Tv, Wrench } from 'lucide-react'
import { FeatureCard, HeroCard, SectionHeader, StatusBadge } from '../../../design-system'

const sections = [
  ['Regras da Comunidade', 'Respeito, resenha saudavel e moderacao ativa.', Shield],
  ['Regras do Chat', 'O xat oficial e o centro da comunidade.', MessageCircle],
  ['Regulamento do Bolao', 'Palpites fecham antes do inicio dos jogos.', Trophy],
  ['Regulamento das BarCoins', 'Moeda social, sem venda e sem premium.', Shield],
  ['Regras das Brincadeiras', 'Eventos leves, sociais e moderados.', Trophy],
  ['Regras da Radio', 'Pedidos privados para locutores/admin.', Radio],
  ['Regras da TV', 'Somente embeds permitidos.', Tv],
  ['Regras do BarStudio', 'Ferramentas centralizadas no hub.', Wrench],
  ['Politica de Moderacao', 'A administracao pode agir para proteger a sala.', Shield],
  ['FAQ', 'Perguntas frequentes do portal.', BookOpen],
]

export default function ManualPage() {
  return (
    <main className="bds-release-page">
      <HeroCard className="bds-release-hero" eyebrow="Manual Oficial" title="Manual do Bar dos Amigos" subtitle="Regras, regulamentos e FAQ para a versao 1.0 do portal." />
      <section className="bds-release-section">
        <SectionHeader eyebrow="Documentacao do usuario" title="Secoes oficiais" subtitle="Conteudo inicial preparado para manutencao editorial." />
        <div className="bds-release-grid bds-release-grid--two">
          {sections.map(([title, description, Icon]) => <FeatureCard key={title} icon={<Icon size={20} />} title={title} description={description} action={<StatusBadge status="OFICIAL">OFICIAL</StatusBadge>} />)}
        </div>
      </section>
    </main>
  )
}
