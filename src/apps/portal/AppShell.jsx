import { Outlet } from "react-router-dom";

import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import PortalSeo from "./seo/PortalSeo";
import AuthDialog from "../../modules/auth/AuthDialog";
import { AuthProvider } from "../../modules/auth/AuthContext";

const portalBackground = {
  backgroundImage: 'url("/backgrounds/portal-bg.webp")',
  backgroundPosition: 'center top',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
}

export default function AppShell() {
  return (
    <AuthProvider>
      <div className="min-h-screen text-[var(--text)]" style={portalBackground}>
        <PortalSeo />

        <Header />

        <div className="w-full py-5">
          <main>
            <Outlet />
          </main>
        </div>

        <Footer />
        <AuthDialog />
      </div>
    </AuthProvider>
  );
}
