export default function PortalCard({
  title,
  icon,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-[18px] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-4 shadow-[var(--bds-shadow-level-1)] ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-lg font-black text-[var(--bds-color-primary-hover)]">
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
