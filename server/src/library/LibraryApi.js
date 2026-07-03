export class LibraryApi {
  constructor(libraryManager) {
    this.libraryManager = libraryManager;
  }

  list() {
    const tracks = this.libraryManager?.getTracks() || [];
    return { tracks, total: tracks.length };
  }

  stats() {
    return this.libraryManager?.getStats() || {};
  }

  search(query) {
    const tracks = this.libraryManager?.search(query) || [];
    return { tracks, total: tracks.length, query: query || "" };
  }

  genres() {
    return this.libraryManager?.getGenres() || [];
  }

  artists() {
    return this.libraryManager?.getArtists() || [];
  }

  albums() {
    return this.libraryManager?.getAlbums() || [];
  }

  folders() {
    return this.libraryManager?.getFolders() || [];
  }

  events(limit) {
    return {
      events: this.libraryManager?.getEvents(limit) || [],
      total: this.libraryManager?.getEvents(limit)?.length || 0,
    };
  }
}
