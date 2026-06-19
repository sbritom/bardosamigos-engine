export function createProfileDto(data = {}) {
  return {
    id: data.id,
    displayName: data.displayName || data.display_name || '',
    username: data.username || '',
    avatarUrl: data.avatarUrl || data.avatar_url || '',
    role: data.role || 'user',
    status: data.status || 'active',
    preferences: data.preferences || {},
  }
}
