import Header from "./Header";
import Footer from "./Footer";
import HomePage from "../pages/HomePage";

const backgroundLayer = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
  backgroundImage: 'url("/backgrounds/portal-bg.webp")',
  backgroundPosition: 'center top',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  filter: 'grayscale(1) brightness(.58) contrast(1.08)',
  transform: 'translateZ(0)',
}

const contentLayer = {
  position: 'relative',
  zIndex: 1,
}

export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-[#080808] text-[var(--text)]">
      <div aria-hidden="true" style={backgroundLayer} />
      <div style={contentLayer}>
        <Header />
        <HomePage />
        <Footer />
      </div>
    </div>
  );
}
