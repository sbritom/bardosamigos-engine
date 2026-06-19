import { Outlet } from "react-router-dom";

import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import Sidebar from "../../shared/layout/Sidebar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <Header />

      <div className="mx-auto flex max-w-[1700px] gap-5 p-5">

        <Sidebar />

        <main className="flex-1">
          <Outlet />
        </main>

      </div>

      <Footer />

    </div>
  );
}