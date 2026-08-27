export class LibraryStatistics {
  static generate(tracks = [], updatedAt = new Date().toISOString()) {
    const artists = new Set();
    const albums = new Set();
    const genres = new Set();
    const folders = new Set();
    const extensions = {};
    const codecs = {};
    let totalSize = 0;
    let totalDuration = 0;
    let bitrateTotal = 0;
    let bitrateCount = 0;

    tracks.forEach((track) => {
      totalSize += Number(track.size || 0);
      totalDuration += Number(track.duration || 0);
      if (track.artist) artists.add(track.artist);
      if (track.album) albums.add(track.album);
      if (track.genre) genres.add(track.genre);
      if (track.sourceFolder) folders.add(track.sourceFolder);
      if (track.extension) {
        extensions[track.extension] = (extensions[track.extension] || 0) + 1;
      }
      if (track.codec) codecs[track.codec] = (codecs[track.codec] || 0) + 1;
      if (track.bitrate) {
        bitrateTotal += Number(track.bitrate);
        bitrateCount += 1;
      }
    });

    const topCodec = Object.entries(codecs).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalTracks: tracks.length,
      totalSize,
      totalDuration,
      averageBitrate: bitrateCount ? Math.round(bitrateTotal / bitrateCount) : null,
      topCodec,
      artistsCount: artists.size,
      albumsCount: albums.size,
      genresCount: genres.size,
      foldersCount: folders.size,
      extensions,
      codecs,
      lastUpdatedAt: updatedAt,
      genres: [...genres].sort(),
      artists: [...artists].sort(),
      albums: [...albums].sort(),
      folders: [...folders].sort(),
    };
  }
}
