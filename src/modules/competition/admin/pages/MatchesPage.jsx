import { CompetitionCrudPage } from '../components/CompetitionCrudPage'
import { competitionAdminEntities } from '../config/adminEntities'
import { CompetitionAdminLayout } from './CompetitionAdminLayout'

export default function MatchesPage() {
  return (
    <CompetitionAdminLayout>
      <CompetitionCrudPage entity={competitionAdminEntities.matches} />
    </CompetitionAdminLayout>
  )
}
