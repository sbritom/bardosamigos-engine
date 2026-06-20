import { CompetitionCrudPage } from '../components/CompetitionCrudPage'
import { competitionAdminEntities } from '../config/adminEntities'
import { CompetitionAdminLayout } from './CompetitionAdminLayout'

export default function TeamsPage() {
  return (
    <CompetitionAdminLayout>
      <CompetitionCrudPage entity={competitionAdminEntities.teams} />
    </CompetitionAdminLayout>
  )
}
