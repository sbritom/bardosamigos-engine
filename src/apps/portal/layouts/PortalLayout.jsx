import Header from "./Header";
import Footer from "./Footer";
import HomePage from "../pages/HomePage";

const portalBackground = {
  backgroundImage: 'url("/backgrounds/portal-bg.webp")',
  backgroundPosition: 'center top',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  backgroundColor: '#151515',
  backgroundBlendMode: 'luminosity',
}

export default function PortalLayout() {
  return (
    <div className="min-h-screen text-[var(--text)]" style={portalBackground}>
      <Header />
      <HomePage />
      <Footer />
    </div>
  );
}
