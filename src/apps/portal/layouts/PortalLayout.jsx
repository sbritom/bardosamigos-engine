import Header from "./Header";
import Footer from "./Footer";
import HomePage from "../pages/HomePage";

const portalBackground = {
  backgroundImage: 'linear-gradient(180deg, rgba(8,8,8,.72), rgba(5,5,5,.88)), radial-gradient(circle at 18% 0%, rgba(212,175,55,.12), transparent 34%), url("/backgrounds/portal-bg.webp")',
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
