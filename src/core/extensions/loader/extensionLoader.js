export function createExtensionLoader(dependencies = {}) {
  const { registry, lifecycle } = dependencies

  return {
    async load(extension) {
      const registered = registry.register(extension)

      if (!registered) {
        return {
          ok: false,
          error: 'Invalid extension manifest.',
        }
      }

      await lifecycle.install(extension.manifest.id)

      return {
        ok: true,
        extension: registry.get(extension.manifest.id),
      }
    },

    async loadMany(extensions = []) {
      const results = []

      for (const extension of extensions) {
        results.push(await this.load(extension))
      }

      return results
    },
  }
}
