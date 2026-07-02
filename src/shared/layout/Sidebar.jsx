import { NavLink } from "react-router-dom";

import { getMenuPlugins } from "../../core/registry/plugins";

export default function Sidebar() {
  const menu = getMenuPlugins();

  return (
    <aside className="hidden w-[260px] shrink-0 xl:block">
      <nav className="sticky top-[96px] space-y-2" aria-label="Menu principal">
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
      </nav>
    </aside>
  );
}
