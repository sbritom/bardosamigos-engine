import { Heart, Music2 } from "lucide-react";
import { formatDuration } from "../utils/radioFormatters";

export default function RadioTrackCard({ track, onFavorite }) {
  return (
    <article className="bar-radio-track-card">
      <div className="bar-radio-cover">
        <Music2 size={36} />
      </div>
      <div>
        <strong>{track.title}</strong>
        <p>{track.artist}</p>
      </div>
      <div className="bar-radio-row" style={{ justifyContent: "space-between" }}>
        <span className="bar-radio-badge">{track.category}</span>
        <span>{formatDuration(track.duration)}</span>
      </div>
      <div className="bar-radio-row">
        <button className="bar-radio-button secondary" type="button">Editar</button>
        <button className="bar-radio-button secondary" type="button">Duplicar</button>
        <button className="bar-radio-button secondary" onClick={() => onFavorite(track.id)} type="button">
          <Heart size={16} fill={track.favorite ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
