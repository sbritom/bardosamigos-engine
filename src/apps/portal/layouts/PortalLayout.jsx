import Header from "./Header";
import Footer from "./Footer";
import HomePage from "../pages/HomePage";

export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header />
      <HomePage />
      <Footer />
    </div>
  );
}