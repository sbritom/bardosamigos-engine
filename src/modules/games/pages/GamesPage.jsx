import { Dice5, Gift, HelpCircle, ListChecks, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react'
import { ActionButton, FeatureCard, HeroCard, SectionHeader, StatCard, StatusBadge } from '../../../design-system'

const games = [
  ['Quiz', 'Perguntas rapidas para movimentar o xat.', HelpCircle, 'PRONTO'],
  ['Roleta', 'Sorteio visual para eventos especiais.', RotateCcw, 'PREPARADO'],
  ['Adivinhe o placar', 'Palpite leve ligado ao futebol.', Target, 'PREPARADO'],
  ['Sorteio', 'Ferramenta para premios sociais.', Gift, 'PREPARADO'],
  ['Missoes diarias', 'Desafios simples para engajamento.', ListChecks, 'PREPARADO'],
  ['Eventos especiais', 'Brincadeiras tematicas da comunidade.', Sparkles, 'PREPARADO'],
]

const ranking = [
  ['Top Quiz', '2.180 pts'],
  ['Top Roleta', '1.420 pts'],
  ['Top Missoes', '980 pts'],
  ['Top Eventos', '760 pts'],
]

export default function GamesPage() {
  return (
    <main className="bds-release-page">
      <HeroCard className="bds-release-hero" eyebrow="Brincadeiras" title="Central de brincadeiras" subtitle="Quiz, roleta, placar, sorteios e missoes preparados para integrar Supabase e BarCoins futuramente." action={<ActionButton icon={<Dice5 size={18} />}>Ver brincadeiras</ActionButton>} />

      <section className="bds-release-section">
        <SectionHeader eyebrow="Catalogo" title="Brincadeiras disponiveis" subtitle="Dados locais nesta v1, com services preparados para persistencia futura." />
        <div className="bds-release-grid bds-release-grid--three">
          {games.map(([title, description, Icon, status]) => (
            <FeatureCard key={title} icon={<Icon size={20} />} eyebrow={status} title={title} description={description} action={<StatusBadge status={status}>{status}</StatusBadge>}>
              <ActionButton variant="outline">Detalhes</ActionButton>
            </FeatureCard>
          ))}
        </div>
      </section>

      <section className="bds-release-grid bds-release-grid--two">
        <FeatureCard icon={<Trophy size={20} />} eyebrow="Ranking" title="Ranking das brincadeiras" description="Preparado para dados reais.">
          <div className="bds-release-list">
            {ranking.map(([label, value]) => <div key={label}><strong>{label}</strong><span>{value}</span></div>)}
          </div>
        </FeatureCard>
        <FeatureCard icon={<ListChecks size={20} />} eyebrow="Regras" title="Regras gerais" description="Brincadeiras sao sociais, sem aposta, sem venda de moedas e com moderacao do Bar dos Amigos." />
      </section>
    </main>
  )
}
