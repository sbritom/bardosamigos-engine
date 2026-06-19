export default function Button({
  children,
  variant = "gold",
  className = "",
  ...props
}) {
  const variants = {
    gold: "bg-[var(--gold)] text-black hover:bg-[var(--gold-light)]",
    dark: "bg-black text-white border border-[var(--border)] hover:border-[var(--gold)]",
    ghost: "bg-transparent text-white border border-[var(--border)] hover:border-[var(--gold)]",
    danger: "bg-[var(--danger)] text-white hover:brightness-110",
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