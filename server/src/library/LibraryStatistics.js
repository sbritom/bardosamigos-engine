export class LibraryStatistics {
  static generate(tracks = [], updatedAt = new Date().toISOString()) {
    const artists = new Set();
    const albums = new Set();
    const genres = new Set();
    const folders = new Set();
    const extensions = {};
    let totalSize = 0;

    tracks.forEach((track) => {
      totalSize += Number(track.size || 0);
      if (track.artist) artists.add(track.artist);
      if (track.album) albums.add(track.album);
      if (track.genre) genres.add(track.genre);
      if (track.sourceFolder) folders.add(track.sourceFolder);
      if (track.extension) {
        extensions[track.extension] = (extensions[track.extension] || 0) + 1;
      }
    });

    return {
      totalTracks: tracks.length,
      totalSize,
      artistsCount: artists.size,
      albumsCount: albums.size,
      genresCount: genres.size,
      foldersCount: folders.size,
      extensions,
      lastUpdatedAt: updatedAt,
      genres: [...genres].sort(),
      artists: [...artists].sort(),
      albums: [...albums].sort(),
      folders: [...folders].sort(),
    };
  }
}
