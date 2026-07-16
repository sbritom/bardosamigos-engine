import { AlertCircle, Loader2, Pause, Play, Radio, Volume2 } from "lucide-react";

import { useRadio } from "../../../core/providers/RadioProvider";
import { Button, Progress } from "../../../design-system";
import Container from "../../../shared/layout/Container";

export default function RadioBar() {
  const { playing, loading, error, toggle, currentStation, volume, setVolume } = useRadio();

  return (
    <div className="bds-radio-strip">
      <Container>
        <div className="bds-radio-strip__bar">
          <div className="bds-radio-strip__station">
            <div className="bds-radio-strip__icon">
              <Radio size={26} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-[var(--gold)]">AO VIVO</span>
                {error && <AlertCircle size={14} className="text-red-400" />}
              </div>
              <div className="truncate font-black">{currentStation.name}</div>
              <div className="truncate text-xs text-[var(--secondary)]">{currentStation.currentTrack}</div>
            </div>
          </div>

          <div className="bds-radio-strip__controls">
            <Button
              aria-label={playing ? "Pausar radio" : "Tocar radio"}
              className="h-11 w-11 rounded-full p-0"
              disabled={loading}
              onClick={toggle}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : playing ? <Pause size={20} /> : <Play size={20} />}
            </Button>

            <div className="bds-radio-strip__progress">
              <div className="mb-1 flex justify-between text-xs font-bold uppercase text-[var(--secondary)]">
                <span>{error || currentStation.program}</span>
                <span>{playing ? "Online" : "Pronta"}</span>
              </div>
              <Progress value={playing ? 100 : 0} />
            </div>

            <label className="bds-radio-strip__volume">
              <Volume2 size={18} className="text-[var(--gold)]" />
              <input
                aria-label="Volume da radio"
                className="w-full accent-[var(--gold)]"
                max="100"
                min="0"
                onChange={(event) => setVolume(event.target.value)}
                type="range"
                value={volume}
              />
            </label>
          </div>
        </div>
      </Container>
    </div>
  );
}
