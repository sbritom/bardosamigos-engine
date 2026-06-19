export function createBarcoinWalletDto(data = {}) {
  return {
    id: data.id,
    profileId: data.profileId || data.profile_id,
    balance: Number(data.balance || 0),
    lockedBalance: Number(data.lockedBalance || data.locked_balance || 0),
    lifetimeEarned: Number(data.lifetimeEarned || data.lifetime_earned || 0),
    lifetimeSpent: Number(data.lifetimeSpent || data.lifetime_spent || 0),
  }
}
