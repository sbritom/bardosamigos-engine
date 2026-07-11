import { memo } from "react";
import { Headphones, Pause, Play } from "lucide-react";

import MiniPlayer from "./MiniPlayer";
import CompactPlayer from "./CompactPlayer";

function PortalPlayer({ playing, muted, volume, listeners, track, onToggle, onMute, onVolume, streamAvailable }) {
  return (
    <section className="bar-radio-player-stack">
      <MiniPlayer playing={playing} track={track} onToggle={onToggle} />
      <CompactPlayer muted={muted} volume={volume} onMute={onMute} onVolume={onVolume} />
      <div className="bar-radio-card bar-radio-player-status">
        <button className="bar-radio-primary-button" type="button" onClick={onToggle} disabled={!streamAvailable}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
          {playing ? "Pausar" : "Tocar"}
        </button>
        <div>
          <Headphones size={16} />
          <span>{Number(listeners || 0)} ouvintes</span>
        </div>
      </div>
    </section>
  );
}

export default memo(PortalPlayer);
