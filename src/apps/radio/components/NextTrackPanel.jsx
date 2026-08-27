import { memo } from "react";
import { SkipForward } from "lucide-react";

import { getCoverUrl } from "../radioApi";
import { getTrackArtist, getTrackTitle } from "../radioFormatters";

function NextTrackPanel({ track }) {
  return (
    <section className="bar-radio-card">
      <div className="bar-radio-card-title">
        <SkipForward size={18} />
        <h3>Proxima musica</h3>
      </div>
      <div className="bar-radio-track-row">
        <img src={getCoverUrl(track, 128)} alt="" />
        <div>
          <strong>{getTrackTitle(track)}</strong>
          <span>{getTrackArtist(track)}</span>
        </div>
      </div>
    </section>
  );
}

export default memo(NextTrackPanel);
