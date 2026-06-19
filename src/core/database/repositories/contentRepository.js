import { DATABASE_TABLES } from '../constants/tables'
import { createBaseRepository } from './baseRepository'

export function createContentRepository(client) {
  return {
    newsArticles: createBaseRepository({ client, table: DATABASE_TABLES.NEWS_ARTICLES }),
    tvChannels: createBaseRepository({ client, table: DATABASE_TABLES.TV_CHANNELS }),
    radioStations: createBaseRepository({ client, table: DATABASE_TABLES.RADIO_STATIONS }),
    events: createBaseRepository({ client, table: DATABASE_TABLES.EVENTS }),
    products: createBaseRepository({ client, table: DATABASE_TABLES.STORE_PRODUCTS }),
  }
}
