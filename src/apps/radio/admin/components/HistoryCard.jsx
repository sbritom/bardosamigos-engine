import { memo } from "react";
import { History } from "lucide-react";

function HistoryCard({ history }) {
  const tracks = history?.tracks || [];

  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <History size={18} />
        <h2>Historico</h2>
      </div>
      <div className="radio-admin-tracks">
        {tracks.slice(0, 50).map((track, index) => (
          <div className="radio-admin-track" key={track.id || `${track.title}-${index}`}>
            <span>{track.title || track.track?.title || "Musica sem titulo"}</span>
            <small>{track.artist || track.track?.artist || "Artista N/A"}</small>
          </div>
        ))}
        {!tracks.length && <p>Historico vazio.</p>}
      </div>
    </section>
  );
}

export default memo(HistoryCard);
