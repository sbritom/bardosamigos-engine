import { Outlet } from "react-router-dom";

import Header from "./layouts/Header";
import Footer from "./layouts/Footer";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <Header />

      <div className="w-full py-5">
        <main>
          <Outlet />
        </main>
      </div>

      <Footer />

    </div>
  );
}
