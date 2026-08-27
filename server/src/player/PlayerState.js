export class PlayerState {
  constructor({ volume = 1 } = {}) {
    this.volume = volume;
    this.state = this.empty();
  }

  empty() {
    const now = new Date().toISOString();
    return {
      currentTrack: null,
      previousTrack: null,
      nextTrack: null,
      elapsed: 0,
      remaining: 0,
      duration: 0,
      listeners: 0,
      status: "offline",
      volume: this.volume,
      startedAt: null,
      updatedAt: now,
      cover: null,
      metadata: null,
    };
  }

  update({ nowPlaying = null, previousTrack = null, nextTrack = null, status = "offline", coverBaseUrl = "/engine/covers" } = {}) {
    const track = nowPlaying?.track || nowPlaying || null;
    const duration = Number(track?.duration || nowPlaying?.duration || 0);
    const elapsed = Number(nowPlaying?.elapsed || 0);
    const remaining = Number(nowPlaying?.remaining ?? nowPlaying?.remainingSeconds ?? Math.max(0, duration - elapsed));

    this.state = {
      currentTrack: track,
      previousTrack,
      nextTrack,
      elapsed,
      remaining,
      duration,
      listeners: Number(nowPlaying?.listeners || 0),
      status,
      volume: this.volume,
      startedAt: nowPlaying?.startedAt || null,
      updatedAt: new Date().toISOString(),
      cover: this.coverFor(track, coverBaseUrl),
      metadata: this.metadataFor(track),
    };

    return this.get();
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, Number(volume)));
    this.state = {
      ...this.state,
      volume: this.volume,
      updatedAt: new Date().toISOString(),
    };
    return this.get();
  }

  get() {
    return { ...this.state };
  }

  coverFor(track, coverBaseUrl) {
    const id = encodeURIComponent(track?.id || "default");
    return {
      original: `${coverBaseUrl}/${id}`,
      sizes: {
        512: `${coverBaseUrl}/${id}/512`,
        256: `${coverBaseUrl}/${id}/256`,
        128: `${coverBaseUrl}/${id}/128`,
        64: `${coverBaseUrl}/${id}/64`,
      },
      available: Boolean(track?.coverAvailable),
      fallback: `${coverBaseUrl}/default`,
    };
  }

  metadataFor(track) {
    if (!track) return null;
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArtist: track.albumArtist,
      genre: track.genre,
      year: track.year,
      duration: track.duration,
      durationFormatted: track.durationFormatted,
      bitrate: track.bitrate,
      codec: track.codec,
      sampleRate: track.sampleRate,
      channels: track.channels,
      hash: track.hash,
      isrc: track.isrc,
      musicBrainzId: track.musicBrainzId,
    };
  }
}
