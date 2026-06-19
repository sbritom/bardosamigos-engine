export default function Card({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        rounded-[18px]
        border
        border-[var(--border)]
        bg-[var(--card)]
        shadow-lg
        p-5
        transition-all
        duration-300
        hover:border-[var(--gold)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}