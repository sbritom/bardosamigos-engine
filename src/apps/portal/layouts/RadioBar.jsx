import { useRef, useState } from "react";
import { Pause, Play, Radio, Volume2 } from "lucide-react";
import Container from "../../../shared/layout/Container";

const IMORTAL_RADIO_STREAM = "https://s01.svrdedicado.org:7956/stream";

export default function RadioBar() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
      return;
    }

    audio.pause();
    setPlaying(false);
  }

  function changeVolume(event) {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  }

  return (
    <div className="bds-radio-strip">
      <Container>
        <div className="imortal-radio-player">
          <audio
            ref={audioRef}
            src={IMORTAL_RADIO_STREAM}
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />

          <button
            type="button"
            className="imortal-radio-player__play"
            aria-label={playing ? "Pausar rádio" : "Ouvir rádio"}
            onClick={togglePlayback}
          >
            {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>

          <div className="imortal-radio-player__station">
            <span className="imortal-radio-player__live">
              <i aria-hidden="true" />
              AO VIVO
            </span>
            <strong>IMORTAL0800</strong>
          </div>

          <div className="imortal-radio-player__signal" aria-hidden="true">
            <Radio size={17} />
            <span>Rádio online</span>
          </div>

          <label className="imortal-radio-player__volume" aria-label="Volume da rádio">
            <Volume2 size={17} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={changeVolume}
            />
          </label>
        </div>
      </Container>
    </div>
  );
}
