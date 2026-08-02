import { useNavigate } from "react-router-dom"
import { Settings, UserRound } from "lucide-react"
import { ActionButton } from "../../../design-system"
import { PersonalizationShell, SettingsPanel } from "../components/PersonalizationComponents"
import { settingsSections } from "../data/personalizationData"

export default function SettingsPage() {
  const navigate = useNavigate()

  return (
    <PersonalizationShell
      eyebrow="Configuracoes"
      title="Preferencias da conta"
      description="Base para tema, idioma, esportes e notificacoes futuras."
      icon={<Settings size={40} />}
      actions={
        <ActionButton variant="secondary" icon={<UserRound size={16} />} onClick={() => navigate("/profile")}>
          Voltar ao perfil
        </ActionButton>
      }
    >
      <SettingsPanel sections={settingsSections} />
    </PersonalizationShell>
  )
}
