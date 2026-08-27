export function createSyncAdapter({ integration, fetcher = null }) {
  return {
    integration,
    async fetch(request = {}) {
      if (!fetcher) {
        return {
          data: [],
          error: null,
          skipped: true,
          metadata: {
            reason: 'No external API fetcher configured.',
            request,
          },
        }
      }

      try {
        const data = await fetcher(request)
        return { data: Array.isArray(data) ? data : [], error: null, skipped: false }
      } catch (error) {
        return { data: [], error, skipped: false }
      }
    },
  }
}
