import { Coins, Gift, History, ListChecks, ShieldCheck, Trophy, Wallet } from 'lucide-react'
import { ActionButton, FeatureCard, HeroCard, SectionHeader, StatCard, StatusBadge } from '../../../design-system'

const history = [
  ['Bonus de boas-vindas', '+100', 'Preparado'],
  ['Missao diaria', '+20', 'Preparado'],
  ['Recompensa social', '+50', 'Futuro'],
]

const rewards = [
  ['Top 3 BarCoins', 'Pode receber recompensa em xats futuramente.'],
  ['Eventos especiais', 'Premios sociais definidos pela administracao.'],
  ['Competition', 'Gatilho preparado, sem distribuicao automatica nesta tela.'],
]

export default function BarCoinsPage() {
  return (
    <main className="bds-release-page">
      <HeroCard className="bds-release-hero" eyebrow="Moeda social" title="BarCoins" subtitle="BarCoins nao sao dinheiro, nao sao premium e nao possuem venda. Sao pontos sociais da comunidade." action={<ActionButton icon={<Wallet size={18} />}>Ver carteira</ActionButton>} />

      <div className="bds-release-grid bds-release-grid--four">
        <StatCard icon={<Coins size={18} />} label="Saldo" value="0" hint="usuario nao autenticado" />
        <StatCard icon={<Gift size={18} />} label="Recebido" value="0" hint="total social" />
        <StatCard icon={<History size={18} />} label="Gasto" value="0" hint="historico preparado" />
        <StatCard icon={<Trophy size={18} />} label="Ranking" value="Top 3" hint="recompensa futura em xats" />
      </div>

      <section className="bds-release-grid bds-release-grid--two">
        <FeatureCard icon={<History size={20} />} eyebrow="Carteira" title="Historico" description="Movimentacoes aparecerao aqui quando houver usuario autenticado.">
          <div className="bds-release-list">
            {history.map(([title, value, status]) => <div key={title}><strong>{title}</strong><span>{value} - {status}</span></div>)}
          </div>
        </FeatureCard>
        <FeatureCard icon={<ListChecks size={20} />} eyebrow="Missoes" title="Como ganhar" description="Missoes sociais preparadas para Competition, Brincadeiras e Comunidade.">
          <ActionButton variant="outline">Ver missoes</ActionButton>
        </FeatureCard>
      </section>

      <section className="bds-release-section">
        <SectionHeader eyebrow="Recompensas" title="Recompensas futuras" subtitle="Sem venda, sem assinatura e sem premium." />
        <div className="bds-release-grid bds-release-grid--three">
          {rewards.map(([title, description]) => <FeatureCard key={title} icon={<ShieldCheck size={20} />} title={title} description={description} action={<StatusBadge status="FUTURO">FUTURO</StatusBadge>} />)}
        </div>
      </section>
    </main>
  )
}
