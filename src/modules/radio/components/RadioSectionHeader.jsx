export default function RadioSectionHeader({ eyebrow, title, description, action }) {
  return (
    <header className="bar-radio-section-header">
      <div>
        {eyebrow && <span className="bar-radio-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
