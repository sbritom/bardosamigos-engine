export const AutoDJService = {
  getStatus(config = {}) {
    return {
      enabled: Boolean(config.autoDjEnabled),
      implemented: false,
      message: "AutoDJ real sera implementado na Sprint 3.",
    };
  },

  buildQueue({ tracks = [], shuffle = true } = {}) {
    return shuffle ? [...tracks].sort(() => 0.5 - Math.random()) : tracks;
  },
};
