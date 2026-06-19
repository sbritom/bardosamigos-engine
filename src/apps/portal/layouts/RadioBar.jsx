import { Pause, Play, Volume2 } from "lucide-react";

import { useRadio } from "../../../core/providers/RadioProvider";
import Container from "../../../shared/layout/Container";

export default function RadioBar() {
  const { playing, toggle, currentStation } = useRadio();

  return (
    <div className="border-b border-[#2d2208] bg-[#080808]">
      <Container>
        <div className="flex h-[72px] items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#D4AF37] text-2xl">
              🎧
            </div>

            <div>
              <div className="text-xs uppercase text-zinc-400">
                Rádio Bar dos Amigos
              </div>

              <div className="font-bold">{currentStation.name}</div>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-5 md:flex">
            <button
              onClick={toggle}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-black"
            >
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </button>

            <div className="h-2 w-full max-w-[420px] rounded-full bg-[#252525]">
              <div className="h-full w-1/3 rounded-full bg-[#D4AF37]" />
            </div>

            <Volume2 size={22} />
          </div>

          <button
            onClick={toggle}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D4AF37] text-black md:hidden"
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
      </Container>
    </div>
  );
}