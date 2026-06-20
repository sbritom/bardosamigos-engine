import { CompetitionCrudPage } from '../components/CompetitionCrudPage'
import { competitionAdminEntities } from '../config/adminEntities'
import { CompetitionAdminLayout } from './CompetitionAdminLayout'

export default function RoundsPage() {
  return (
    <CompetitionAdminLayout>
      <CompetitionCrudPage entity={competitionAdminEntities.rounds} />
    </CompetitionAdminLayout>
  )
}
