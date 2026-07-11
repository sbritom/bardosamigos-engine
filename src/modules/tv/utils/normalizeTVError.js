export function normalizeTVError(error, fallback = 'Nao foi possivel carregar a TV agora.') {
  if (!error) return null
  return error instanceof Error ? error : new Error(error.message || fallback)
}
