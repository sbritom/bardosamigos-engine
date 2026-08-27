import { memo } from "react";
import { History } from "lucide-react";

import { getCoverUrl } from "../radioApi";
import { getTrackArtist, getTrackTitle } from "../radioFormatters";

function HistoryPanel({ tracks = [] }) {
  const visibleTracks = tracks.slice(0, 10);

  return (
    <section className="bar-radio-card bar-radio-history">
      <div className="bar-radio-card-title">
        <History size={18} />
        <h3>Historico</h3>
      </div>
      <div className="bar-radio-list">
        {visibleTracks.length ? (
          visibleTracks.map((track, index) => (
            <div className="bar-radio-track-row" key={track.id || `${track.title}-${index}`}>
              <img src={getCoverUrl(track, 64)} alt="" />
              <div>
                <strong>{getTrackTitle(track)}</strong>
                <span>{getTrackArtist(track)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="bar-radio-empty">Historico indisponivel no momento.</p>
        )}
      </div>
    </section>
  );
}

export default memo(HistoryPanel);
