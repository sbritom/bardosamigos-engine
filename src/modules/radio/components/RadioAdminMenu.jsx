import { RADIO_ADMIN_SECTIONS } from "../config/radioConfig";

export default function RadioAdminMenu({ activeSection, onChange }) {
  return (
    <nav className="bar-radio-sidebar" aria-label="Menu da Radio">
      {RADIO_ADMIN_SECTIONS.map((section) => (
        <button
          className={`bar-radio-nav-button ${activeSection === section.id ? "is-active" : ""}`}
          key={section.id}
          onClick={() => onChange(section.id)}
          type="button"
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
