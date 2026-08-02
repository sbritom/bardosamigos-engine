import { useNavigate } from "react-router-dom"
import { Settings, Sparkles, UserRound } from "lucide-react"
import { ActionButton } from "../../../design-system"
import { ForYouPreview, PersonalizationShell } from "../components/PersonalizationComponents"
import { forYouSections } from "../data/personalizationData"

export default function ForYouPage() {
  const navigate = useNavigate()

  return (
    <PersonalizationShell
      eyebrow="Para voce"
      title="Conteudo personalizado"
      description="Estrutura preparada para recomendar conteudos a partir dos seus favoritos."
      icon={<Sparkles size={40} />}
      actions={
        <>
          <ActionButton variant="secondary" icon={<UserRound size={16} />} onClick={() => navigate("/profile")}>
            Perfil
          </ActionButton>
          <ActionButton variant="outline" icon={<Settings size={16} />} onClick={() => navigate("/settings")}>
            Configuracoes
          </ActionButton>
        </>
      }
    >
      <ForYouPreview sections={forYouSections} />
    </PersonalizationShell>
  )
}
