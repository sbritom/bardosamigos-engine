export default function Grid({
  children,
  cols = 12,
  gap = 4,
}) {
  return (
    <div
      className={`grid grid-cols-${cols} gap-${gap}`}
    >
      {children}
    </div>
  );
}