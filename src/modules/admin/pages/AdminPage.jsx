import { Activity, Bot, Coins, Gamepad2, Logs, Radio, Shield, Store, Tv, Users, Wrench } from 'lucide-react'
import { FeatureCard, HeroCard, SectionHeader, StatusBadge } from '../../../design-system'

const modules = [
  ['Football Admin', 'Competicoes, jogos, times e resultados.', Shield],
  ['Competition Admin', 'Bolao, palpites, ranking e auditoria.', Activity],
  ['TV Admin', 'Canais, categorias e embeds.', Tv],
  ['Radio Admin', 'Pedidos privados, locutores e historico.', Radio],
  ['Comunidade Admin', 'Eventos, conquistas e missoes.', Users],
  ['Brincadeiras Admin', 'Quiz, roleta, sorteios e ranking.', Gamepad2],
  ['BarCoins Admin', 'Ajustes manuais e historico.', Coins],
  ['BarStudio Admin', 'Ferramentas e estados.', Wrench],
  ['Integracoes', 'Supabase, Football-Data, GNews e YouTube.', Logs],
  ['BarAI Admin', 'Sugestoes e mensagens assistivas locais.', Bot],
  ['Loja Admin', 'Preparado para recompensas futuras.', Store],
]

export default function AdminPage() {
  return (
    <main className="bds-release-page">
      <HeroCard className="bds-release-hero" eyebrow="Admin modular" title="Administracao do portal" subtitle="Area preparada para usuarios autorizados. Nao deve aparecer para usuarios comuns no menu publico." />
      <section className="bds-release-section">
        <SectionHeader eyebrow="Modulos" title="Areas administrativas" subtitle="Admin modular, sem monolito." />
        <div className="bds-release-grid bds-release-grid--three">
          {modules.map(([title, description, Icon]) => <FeatureCard key={title} icon={<Icon size={20} />} title={title} description={description} action={<StatusBadge status="ADMIN">ADMIN</StatusBadge>} />)}
        </div>
      </section>
    </main>
  )
}
