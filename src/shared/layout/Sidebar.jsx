import { NavLink } from "react-router-dom";

import { getMenuPlugins } from "../../core/registry/plugins";

export default function Sidebar() {
  const menu = getMenuPlugins();

  return (
    <aside className="hidden w-[260px] shrink-0 xl:block">
      <div className="sticky top-[96px] rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-4 text-lg font-black text-[var(--gold)]">
          Navegação
        </div>

        <div className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    isActive
                      ? "bg-[var(--gold)] text-black"
                      : "text-white hover:bg-black hover:text-[var(--gold)]"
                  }`
                }
              >
                <Icon size={18} />
                <span className="font-semibold">{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </aside>
  );
}