import { Heart, Pause, Play, Radio, Share2, Volume2, VolumeX } from "lucide-react";

import { useNowPlaying, usePlayer } from "./hooks";
import { RADIO_NAME, RADIO_SLOGAN } from "./config/radioConfig";
import { formatDuration } from "./utils/radioFormatters";

export default function RadioPlayer() {
  const player = usePlayer();
  const nowPlaying = useNowPlaying();
  const current = nowPlaying.current;

  return (
    <section className="bar-radio-player" aria-label={RADIO_NAME}>
      <div className="bar-radio-player__top">
        <div className="bar-radio-player__art">
          <Radio size={36} />
        </div>
        <div style={{ minWidth: 0 }}>
          <span className="bar-radio-live">AO VIVO</span>
          <h2 style={{ margin: "8px 0 4px" }}>{RADIO_NAME}</h2>
          <p style={{ color: "#cbd5e1", margin: 0 }}>{RADIO_SLOGAN}</p>
        </div>
      </div>

      <div>
        <span className="bar-radio-eyebrow">Tocando agora</span>
        <h3 style={{ fontSize: "1.6rem", margin: "0 0 4px" }}>{current?.title || "Programacao em preparacao"}</h3>
        <p style={{ color: "#cbd5e1", margin: 0 }}>{current ? `${current.artist} - ${current.album}` : "Stream em breve"}</p>
      </div>

      <div>
        <div className="bar-radio-row" style={{ justifyContent: "space-between" }}>
          <span>{player.hasStream ? "Online" : "Aguardando stream"}</span>
          <span>{formatDuration(nowPlaying.remainingSeconds)}</span>
        </div>
        <input className="bar-radio-range" max="100" readOnly type="range" value={player.hasStream ? 42 : 0} />
      </div>

      <div className="bar-radio-player__controls">
        <button className="bar-radio-button" onClick={player.toggle} type="button">
          {player.playing ? <Pause size={18} /> : <Play size={18} />}
          {player.playing ? "Pause" : "Play"}
        </button>
        <button className="bar-radio-button secondary" onClick={() => player.setMuted(!player.muted)} type="button">
          {player.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          aria-label="Volume"
          className="bar-radio-range"
          max="100"
          min="0"
          onChange={(event) => player.setVolume(Number(event.target.value))}
          type="range"
          value={player.volume}
        />
        <button className="bar-radio-button secondary" type="button"><Share2 size={18} /></button>
        <button className="bar-radio-button secondary" type="button"><Heart size={18} /></button>
      </div>

      {player.error && <div className="bar-radio-card">{player.error}</div>}

      <div className="bar-radio-grid">
        <div>
          <small>Ultimas musicas</small>
          {nowPlaying.history.map((track) => (
            <p key={track.id}>{track.title}</p>
          ))}
        </div>
        <div>
          <small>Proxima musica</small>
          <p>{nowPlaying.next?.title || "Fila em preparacao"}</p>
        </div>
        <div>
          <small>Qualidade</small>
          <p>96 kbps MP3</p>
        </div>
      </div>

      <audio
        ref={player.audioRef}
        preload="none"
        src={player.streamUrl}
        onError={() => {
          player.setPlaying(false);
          player.setError("Stream offline ou nao configurado.");
        }}
        onPause={() => player.setPlaying(false)}
        onPlay={() => player.setPlaying(true)}
      />
    </section>
  );
}
