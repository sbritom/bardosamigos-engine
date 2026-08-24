import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

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
}

function useDeferredPortalBackgrounds(pathname) {
  useEffect(() => {
    let observer = null
    const frame = window.requestAnimationFrame(() => {
      const targets = Array.from(document.querySelectorAll('.bds-home-community-note'))
      if (!targets.length) return

      if (!('IntersectionObserver' in window)) {
        targets.forEach((target) => target.classList.add('bds-deferred-background-ready'))
        return
      }

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('bds-deferred-background-ready')
          observer?.unobserve(entry.target)
        })
      }, {
        rootMargin: '600px 0px',
        threshold: 0.01,
      })

      targets.forEach((target) => observer.observe(target))
    })

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [pathname])
}

export default function AppShell() {
  const { pathname } = useLocation()
  useDeferredPortalBackgrounds(pathname)

  return (
    <AuthProvider>
      <div className="bds-portal-shell min-h-screen text-[var(--text)]" style={portalBackground}>
        <PortalSeo />

        <a className="bds-skip-link" href="#portal-main-content">
          Pular para o conteudo
        </a>

        <Header />

        <div className="w-full py-5">
          <main id="portal-main-content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>

        <Footer />
        <AuthDialog />
      </div>
    </AuthProvider>
  );
}
