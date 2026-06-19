import { createBarcoinRepository } from '../repositories/barcoinRepository'

export function createBarcoinPersistenceService(client) {
  const repository = createBarcoinRepository(client)

  return {
    getWallet(walletId) {
      return repository.wallets.findById(walletId)
    },

    listTransactions(profileId) {
      return repository.transactions.list({ profile_id: profileId })
    },
  }
}
