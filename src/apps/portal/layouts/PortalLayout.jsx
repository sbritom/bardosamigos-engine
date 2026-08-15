import Header from "./Header";
import Footer from "./Footer";
import HomePage from "../pages/HomePage";

const portalBackground = {
  backgroundImage: 'linear-gradient(180deg, rgba(11,61,145,.58), rgba(6,27,68,.78)), url("/backgrounds/portal-bg.webp")',
  backgroundPosition: 'center top',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
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
