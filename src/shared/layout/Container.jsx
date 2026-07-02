export default function Container({ children, className = "" }) {
  return (
    <div className={`mx-auto w-full max-w-[1560px] px-4 ${className}`}>
      {children}
    </div>
  );
}