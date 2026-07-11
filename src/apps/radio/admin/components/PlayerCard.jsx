import { memo } from "react";
import { Disc3 } from "lucide-react";

import { formatDuration } from "../adminFormatters";

function PlayerCard({ player }) {
  const track = player?.currentTrack;
  const cover = player?.cover?.sizes?.["256"] || player?.cover?.original || player?.cover?.fallback;

  return (
    <section className="radio-admin-panel radio-admin-player">
      <div className="radio-admin-panel-title">
        <Disc3 size={18} />
        <h2>Radio</h2>
      </div>
      <div className="radio-admin-player-grid">
        {cover ? <img src={cover} alt="" /> : <div className="radio-admin-cover-empty"><Disc3 size={34} /></div>}
        <div>
          <strong>{track?.title || "Nenhuma musica atual"}</strong>
          <span>{track?.artist || "Artista indisponivel"}</span>
          <span>{track?.album || "Album indisponivel"}</span>
          <div className="radio-admin-tags">
            <small>{formatDuration(player?.elapsed)} / {formatDuration(player?.duration)}</small>
            <small>{track?.bitrate ? `${track.bitrate} kbps` : "Bitrate N/A"}</small>
            <small>{track?.codec || "Codec N/A"}</small>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(PlayerCard);
