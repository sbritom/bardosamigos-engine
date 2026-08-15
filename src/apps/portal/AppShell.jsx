import { Outlet } from "react-router-dom";

import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import PortalSeo from "./seo/PortalSeo";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-transparent text-[var(--text)]">
      <PortalSeo />

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
