import { CompetitionCrudPage } from '../components/CompetitionCrudPage'
import { competitionAdminEntities } from '../config/adminEntities'
import { CompetitionAdminLayout } from './CompetitionAdminLayout'

export default function ChampionshipsPage() {
  return (
    <CompetitionAdminLayout>
      <CompetitionCrudPage entity={competitionAdminEntities.championships} />
    </CompetitionAdminLayout>
  )
}
