import Container from "./Container";

export default function Section({
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <section className={`py-6 ${className}`}>
      <Container>

        {(title || subtitle) && (
          <div className="mb-5">

            {title && (
              <h2 className="text-2xl font-bold text-[var(--bds-color-primary-hover)]">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-2 text-[var(--bds-color-text-secondary)]">
                {subtitle}
              </p>
            )}

          </div>
        )}

        {children}

      </Container>
    </section>
  );
}
