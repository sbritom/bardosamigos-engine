import { memo } from "react";
import { Music2 } from "lucide-react";

function NowPlayingWidget({ track }) {
  return (
    <section className="bar-radio-card bar-xat-panel">
      <div className="bar-radio-card-title">
        <Music2 size={18} />
        <h3>Now Playing</h3>
      </div>
      <div className="bar-xat-panel-content">
        <strong>{track?.title || "Nenhuma musica informada"}</strong>
        <span>{track?.artist || "Artista indisponivel"}</span>
        <span>{track?.album || "Album indisponivel"}</span>
      </div>
    </section>
  );
}

export default memo(NowPlayingWidget);
