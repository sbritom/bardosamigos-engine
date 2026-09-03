import { useState } from "react";
import { CalendarDays, ListMusic, LogOut, Mic2, RadioTower } from "lucide-react";

import AdminRouteGuard from "../../../core/auth/AdminRouteGuard";
import { ADMIN_ROLES } from "../../../core/auth/adminAuthService";
import { signOutRadioRequestsAdmin } from "../requests/radioRequestsApi";
import RadioRequestsPanel from "../requests/RadioRequestsPanel";
import RadioContentManager from "./RadioContentManager";
import "./radioAdmin.css";

const RADIO_ADMIN_ROLES = [ADMIN_ROLES.ADMIN, ADMIN_ROLES.LOCUTOR];

// Login da Rádio usa o shell administrativo centralizado.

function RadioAdminContent() {
  const [activeSection, setActiveSection] = useState("requests");
  const [logoutBusy, setLogoutBusy] = useState(false);

  async function handleLogout() {
    try {
      setLogoutBusy(true);
      await signOutRadioRequestsAdmin();
    } finally {
      setLogoutBusy(false);
    }
  }

  return (
    <main className="radio-admin-page">
      <header className="radio-admin-header radio-admin-header--with-actions">
        <div className="radio-admin-header__brand">
          <span className="radio-admin-header__icon" aria-hidden="true">
            <RadioTower size={22} />
          </span>

          <div>
            <span>IMORTAL0800</span>
            <h1>PAINEL DA RÁDIO</h1>
            <p>Pedidos, programas e grade de locutores em um só lugar.</p>
          </div>
        </div>

        <button type="button" onClick={handleLogout} disabled={logoutBusy}>
          <LogOut size={16} />
          {logoutBusy ? "Saindo..." : "Sair"}
        </button>
      </header>

      <nav className="radio-admin-sections" aria-label="Áreas do painel da rádio">
        <button
          type="button"
          className={activeSection === "requests" ? "is-active" : ""}
          onClick={() => setActiveSection("requests")}
        >
          <ListMusic size={16} />
          Pedidos
        </button>

        <button
          type="button"
          className={activeSection === "programs" ? "is-active" : ""}
          onClick={() => setActiveSection("programs")}
        >
          <Mic2 size={16} />
          Programas
        </button>

        <button
          type="button"
          className={activeSection === "schedule" ? "is-active" : ""}
          onClick={() => setActiveSection("schedule")}
        >
          <CalendarDays size={16} />
          Grade de locutores
        </button>
      </nav>

      <div className="radio-admin-grid">
        {activeSection === "requests" ? <RadioRequestsPanel /> : null}
        {activeSection === "programs" ? <RadioContentManager mode="programs" /> : null}
        {activeSection === "schedule" ? <RadioContentManager mode="schedule" /> : null}
      </div>
    </main>
  );
}

export default function RadioAdminPage() {
  return (
    <AdminRouteGuard
      allowedRoles={RADIO_ADMIN_ROLES}
      title="Painel da Rádio"
      centeredAuth={true}
    >
      <RadioAdminContent />
    </AdminRouteGuard>
  );
}
