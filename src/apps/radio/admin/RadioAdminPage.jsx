import { useEffect, useState } from "react";
import { CalendarDays, ListMusic, LogOut, Mic2 } from "lucide-react";

import {
  getRadioRequestsAdminAccess,
  signInRadioRequestsAdmin,
  signOutRadioRequestsAdmin,
} from "../requests/radioRequestsApi";
import RadioRequestsPanel from "../requests/RadioRequestsPanel";
import RadioContentManager from "./RadioContentManager";
import "./radioAdmin.css";

const INITIAL_ACCESS = {
  loading: true,
  allowed: false,
  hasSession: false,
  reason: "",
  user: null,
};

export default function RadioAdminPage() {
  const [access, setAccess] = useState(INITIAL_ACCESS);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("requests");

  useEffect(() => {
    let active = true;
    getRadioRequestsAdminAccess().then((result) => {
      if (active) setAccess({ loading: false, ...result });
    });
    return () => {
      active = false;
    };
  }, []);

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoginError("");

    try {
      setLoginLoading(true);
      const result = await signInRadioRequestsAdmin(loginForm);
      setAccess({ loading: false, ...result });
    } catch (error) {
      setLoginError(error.message || "Nao foi possivel entrar no painel.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await signOutRadioRequestsAdmin();
    setLoginForm({ username: "", password: "" });
    setLoginError("");
    setAccess({ ...INITIAL_ACCESS, loading: false });
  }

  if (access.loading) {
    return (
      <main className="radio-admin-page">
        <header className="radio-admin-header">
          <h1>PAINEL DO LOCUTOR</h1>
        </header>
        <section className="radio-admin-panel radio-admin-auth-panel">
          <p>Carregando acesso...</p>
        </section>
      </main>
    );
  }

  if (!access.hasSession) {
    return (
      <main className="radio-admin-page">
        <section className="radio-admin-login-card" aria-labelledby="radio-admin-login-title">
          <header className="radio-admin-login-header">
            <span>IMORTAL0800</span>
            <h1 id="radio-admin-login-title">PAINEL DO LOCUTOR</h1>
            <p>Pedidos musicais e controle da transmissão.</p>
          </header>

          <form className="radio-admin-login-form" onSubmit={handleLoginSubmit}>
            <label>
              Usuário
              <input
                name="username"
                type="text"
                autoComplete="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
              />
            </label>

            <label>
              Senha
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </label>

            {loginError && <p className="radio-admin-auth-error">{loginError}</p>}

            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (!access.allowed) {
    return (
      <main className="radio-admin-page">
        <header className="radio-admin-header radio-admin-header--with-actions">
          <h1>PAINEL DO LOCUTOR</h1>
          <button type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Sair
          </button>
        </header>

        <section className="radio-admin-panel radio-admin-auth-panel">
          <p>{access.reason || "Acesso nao autorizado para este usuario."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="radio-admin-page">
      <header className="radio-admin-header radio-admin-header--with-actions">
        <div>
          <span>IMORTAL0800</span>
          <h1>PAINEL DO LOCUTOR</h1>
        </div>
        <button type="button" onClick={handleLogout}>
          <LogOut size={16} />
          Sair
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
        {activeSection === "requests" ? <RadioRequestsPanel access={access} /> : null}
        {activeSection === "programs" ? <RadioContentManager mode="programs" /> : null}
        {activeSection === "schedule" ? <RadioContentManager mode="schedule" /> : null}
      </div>
    </main>
  );
}
