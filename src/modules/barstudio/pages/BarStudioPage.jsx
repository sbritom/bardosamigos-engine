import { Image, Music2, Paintbrush, Scissors, Sparkles, UserCircle, Wand2, Wrench } from 'lucide-react'
import { ActionButton, HeroCard, SectionHeader, StatusBadge, ToolCard } from '../../../design-system'

const tools = [
  ['Cortar Foto Redonda', 'Foto pronta para perfil e xat.', Scissors, 'PRONTA'],
  ['NameGrad', 'Gradiente premium para nomes do xat.', Sparkles, 'PRONTA'],
  ['NameWave', 'Efeito visual para nomes.', Wand2, 'PRONTA'],
  ['Redimensionar Imagem', 'Ajuste rapido de tamanho.', Image, 'PRONTA'],
  ['Pedir Musica', 'Pedido privado para locutores.', Music2, 'PRONTA'],
  ['Remover Fundo', 'Recorte automatico preparado.', Paintbrush, 'EM BREVE'],
  ['Criador de Avatar', 'Avatar exclusivo para comunidade.', UserCircle, 'EM BREVE'],
  ['Banner para xat', 'Criacao de banner tematico.', Wrench, 'EM BREVE'],
]

export default function BarStudioPage() {
  return (
    <main className="bds-release-page">
      <HeroCard
        className="bds-release-hero"
        eyebrow="BarStudio"
        title="Hub oficial de ferramentas"
        subtitle="Visual estilo App Store para utilidades da comunidade, xat, radio e imagens."
        action={<ActionButton icon={<Scissors size={18} />}>Abrir ferramentas</ActionButton>}
      />

      <section className="bds-release-section">
        <SectionHeader eyebrow="Ferramentas" title="Catalogo BarStudio" subtitle="Cada ferramenta possui estado claro e esta preparada para evoluir sem quebrar o portal." />
        <div className="bds-release-tools">
          {tools.map(([title, description, Icon, status]) => (
            <ToolCard key={title} icon={<Icon size={22} />} title={title} description={description} status={status} actionLabel={status === 'PRONTA' ? 'Abrir' : 'Em breve'} onAction={status === 'PRONTA' ? () => {} : undefined} />
          ))}
        </div>
      </section>

      <div className="bds-release-callout">
        <StatusBadge status="BDS">BDS</StatusBadge>
        <span>Toda ferramenta nova deve nascer dentro do BarStudio e seguir este catalogo visual.</span>
      </div>
    </main>
  )
}
