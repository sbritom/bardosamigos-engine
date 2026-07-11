import { memo } from "react";
import { Pause, Play, Radio } from "lucide-react";

import { getTrackArtist, getTrackTitle } from "../radioFormatters";

function MiniPlayer({ playing, track, onToggle }) {
  const Icon = playing ? Pause : Play;

  return (
    <section className="bar-radio-card bar-radio-mini">
      <div className="bar-radio-mini-live">
        <Radio size={16} />
        AO VIVO
      </div>
      <div className="bar-radio-mini-track">
        <strong>{getTrackTitle(track)}</strong>
        <span>{getTrackArtist(track)}</span>
      </div>
      <button className="bar-radio-round-button" type="button" onClick={onToggle} aria-label={playing ? "Pausar radio" : "Tocar radio"}>
        <Icon size={18} />
      </button>
    </section>
  );
}

export default memo(MiniPlayer);
