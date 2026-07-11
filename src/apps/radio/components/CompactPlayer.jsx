import { memo } from "react";
import { Volume2, VolumeX } from "lucide-react";

function CompactPlayer({ muted, volume, onMute, onVolume }) {
  const Icon = muted ? VolumeX : Volume2;

  return (
    <section className="bar-radio-card bar-radio-compact">
      <button className="bar-radio-icon-button" type="button" onClick={onMute} aria-label={muted ? "Ativar som" : "Mutar"}>
        <Icon size={18} />
      </button>
      <input
        aria-label="Volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={muted ? 0 : volume}
        onChange={(event) => onVolume(Number(event.target.value))}
      />
      <span>{Math.round((muted ? 0 : volume) * 100)}%</span>
    </section>
  );
}

export default memo(CompactPlayer);
