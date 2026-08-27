import { LockKeyhole, ServerCog, ShieldCheck } from 'lucide-react'
import { FeatureCard, StatusBadge } from '../../../design-system'
import { TV_PROVIDERS } from '../constants'

export function TVSettings() {
  const allowlist = String(import.meta.env.VITE_TV_EMBED_ALLOWED_HOSTS || '')
  return (
    <div className="tv-admin-settings">
      <FeatureCard
        icon={<ShieldCheck size={20} />}
        eyebrow="SEGURANCA"
        title="Politica de embeds"
        description="HTTPS obrigatorio em producao, HTML bruto bloqueado e credenciais removidas."
        action={<StatusBadge status="ATIVA">ATIVA</StatusBadge>}
      />
      <FeatureCard
        icon={<ServerCog size={20} />}
        eyebrow="PROVEDORES"
        title="Catalogo desacoplado"
        description={TV_PROVIDERS.map((provider) => provider.label).join(', ')}
        action={<StatusBadge status="CONFIGURADO">CONFIGURADO</StatusBadge>}
      />
      <FeatureCard
        icon={<LockKeyhole size={20} />}
        eyebrow="ALLOWLIST"
        title="Hosts permitidos"
        description={allowlist || 'Nenhuma allowlist definida. Configure VITE_TV_EMBED_ALLOWED_HOSTS para restringir hosts.'}
      />
    </div>
  )
}
