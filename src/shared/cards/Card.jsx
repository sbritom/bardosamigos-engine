export default function Card({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        rounded-[18px]
        border
        border-[var(--bds-color-border)]
        bg-[var(--bds-color-surface)]
        shadow-[var(--bds-shadow-level-1)]
        p-5
        transition-all
        duration-300
        hover:border-[var(--bds-color-primary-hover)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
