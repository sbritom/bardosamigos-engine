export default function RadioStatCard({ label, value, hint }) {
  return (
    <article className="bar-radio-card">
      <small>{label}</small>
      <strong>{value}</strong>
      {hint && <p>{hint}</p>}
    </article>
  );
}
