export const uploadService = {
  async prepareUpload(files = []) {
    return {
      data: files.map((file, index) => ({
        id: `upload-${Date.now()}-${index}`,
        name: file.name,
        progress: 0,
        status: "queued",
      })),
      error: null,
      mocked: true,
    };
  },
  async extractMetadata(file) {
    return {
      data: {
        title: file?.name?.replace(/\.[^.]+$/, "") || "Nova musica",
        artist: "Artista nao identificado",
        album: "Album nao identificado",
        year: new Date().getFullYear(),
        genre: "Pop",
        bitrate: "96 kbps",
        duration: 0,
        trackNumber: null,
        cover: "",
      },
      error: null,
      mocked: true,
    };
  },
};
