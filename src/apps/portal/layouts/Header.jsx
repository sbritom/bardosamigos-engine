import { Beer, Search, Sun } from "lucide-react";
import { NavLink } from "react-router-dom";

import Container from "../../../shared/layout/Container";
import { getMenuPlugins } from "../../../core/registry/plugins";
import RadioBar from "./RadioBar";

export default function Header() {
  const menu = getMenuPlugins();

  return (
    <>
      <RadioBar />

      <header className="sticky top-0 z-40 border-b border-[#2c2108] bg-[#050505]/95 backdrop-blur">
        <Container>
          <div className="flex h-[74px] items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37] bg-[#151515]">
                <Beer size={28} color="#D4AF37" />
              </div>

              <div>
                <div className="text-3xl font-black leading-none">
                  BAR DOS{" "}
                  <span className="text-[#D4AF37]">AMIGOS</span>
                </div>

                <div className="text-xs font-semibold text-zinc-400">
                  DESDE 2016 • TECH PUB
                </div>
              </div>
            </div>

            <nav className="hidden gap-2 xl:flex">
              {menu.slice(0, 8).map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
                        isActive
                          ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                          : "border-[#272727] bg-[#101214] text-white hover:border-[#D4AF37]"
                      }`
                    }
                  >
                    <Icon size={16} />
                    {item.title}
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-5 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                Online
              </div>

              <Search size={19} />
              <Sun size={18} />
            </div>
          </div>
        </Container>
      </header>
    </>
  );
}