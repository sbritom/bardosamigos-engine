export default function PortalCard({
  title,
  icon,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_10px_30px_rgba(0,0,0,.35)] ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-lg font-black text-[var(--gold)]">
              {icon && <span className="mr-2">{icon}</span>}
              {title}
            </h2>
          )}

          {action}
        </div>
      )}

      {children}
    </section>
  );
}