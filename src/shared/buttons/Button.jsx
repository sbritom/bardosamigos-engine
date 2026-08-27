export default function Button({
  children,
  variant = "gold",
  className = "",
  ...props
}) {
  const variants = {
    gold: "bg-[var(--bds-color-primary)] text-[var(--bds-color-text)] hover:bg-[var(--bds-color-primary-hover)]",
    dark: "bg-[var(--bds-color-surface)] text-[var(--bds-color-text)] border border-[var(--bds-color-border)] hover:border-[var(--bds-color-primary-hover)]",
    ghost: "bg-transparent text-[var(--bds-color-text)] border border-[var(--bds-color-border)] hover:border-[var(--bds-color-primary-hover)]",
    danger: "bg-[var(--bds-color-danger)] text-[var(--bds-color-text)] hover:brightness-110",
  };

  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-black transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
