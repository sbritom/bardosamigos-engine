import { DATABASE_TABLES } from '../constants/tables'
import { createBarcoinWalletDto } from '../dtos/barcoin.dto'
import { createBaseRepository } from './baseRepository'

export function createBarcoinRepository(client) {
  return {
    wallets: createBaseRepository({
      client,
      table: DATABASE_TABLES.BARCOIN_WALLETS,
      mapper: createBarcoinWalletDto,
    }),
    transactions: createBaseRepository({
      client,
      table: DATABASE_TABLES.BARCOIN_TRANSACTIONS,
    }),
  }
}
