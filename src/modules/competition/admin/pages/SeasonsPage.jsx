import { CompetitionCrudPage } from '../components/CompetitionCrudPage'
import { competitionAdminEntities } from '../config/adminEntities'
import { CompetitionAdminLayout } from './CompetitionAdminLayout'

export default function SeasonsPage() {
  return (
    <CompetitionAdminLayout>
      <CompetitionCrudPage entity={competitionAdminEntities.seasons} />
    </CompetitionAdminLayout>
  )
}
