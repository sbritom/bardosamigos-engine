import { Outlet } from "react-router-dom";

import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import PortalSeo from "./seo/PortalSeo";

const portalBackground = {
  backgroundImage: 'linear-gradient(180deg, rgba(8,24,42,.62), rgba(10,30,50,.76)), url("/backgrounds/portal-bg.webp")',
  backgroundPosition: 'center top',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
}

export default function AppShell() {
  return (
    <div className="min-h-screen text-[var(--text)]" style={portalBackground}>
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
