import { memo, useMemo } from "react";
import { Disc3 } from "lucide-react";

import { formatBitrate, formatDuration, getTrackAlbum, getTrackArtist, getTrackGenre, getTrackTitle } from "../radioFormatters";
import { getCoverUrl } from "../radioApi";

function NowPlayingCard({ state }) {
  const track = state.currentTrack;
  const progress = useMemo(() => {
    const duration = Number(state.duration || track?.duration || 0);
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (Number(state.elapsed || 0) / duration) * 100));
  }, [state.duration, state.elapsed, track]);

  const coverUrl = getCoverUrl(track, 512);

  return (
    <section className="bar-radio-card bar-radio-now">
      <div className="bar-radio-cover-wrap">
        {track ? (
          <img className="bar-radio-cover" src={coverUrl} alt={`Capa de ${getTrackTitle(track)}`} />
        ) : (
          <div className="bar-radio-cover bar-radio-cover--empty">
            <Disc3 size={48} />
          </div>
        )}
      </div>

      <div className="bar-radio-now-content">
        <span className="bar-radio-kicker">Tocando agora</span>
        <h2>{getTrackTitle(track)}</h2>
        <p className="bar-radio-artist">{getTrackArtist(track)}</p>

        <div className="bar-radio-meta-grid">
          <span>Album: {getTrackAlbum(track)}</span>
          <span>Genero: {getTrackGenre(track)}</span>
          <span>{formatBitrate(track?.bitrate || state.metadata?.bitrate)}</span>
          <span>Codec: {track?.codec || state.metadata?.codec || "Indisponivel"}</span>
        </div>

        <div className="bar-radio-progress-row">
          <span>{formatDuration(state.elapsed)}</span>
          <div className="bar-radio-progress" aria-label="Progresso da musica">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span>{formatDuration(state.duration || track?.duration)}</span>
        </div>
      </div>
    </section>
  );
}

export default memo(NowPlayingCard);
