function ToolSection({ title, description, children, className = '', hideHeader = false }) {
  if (!children) return null
  return (
    <section className={`bds-image-tool__section ${className}`.trim()}>
      {!hideHeader && (title || description) && (
        <header className="bds-image-tool__section-header">
          {title && <h3>{title}</h3>}
          {description && <p>{description}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

export default function ImageToolLayout({ icon: Icon, title, description, upload, settings, preview, exportPanel, exportTitle = 'Exportação', error, feedback, className = '', hideHeader = false, hideSectionHeaders = false }) {
  return (
    <div className={`bds-image-tool ${className}`.trim()}>
      {!hideHeader && (
        <header className="bds-image-tool__header">
          {Icon && <span className="bds-image-tool__header-icon"><Icon size={20} aria-hidden="true" /></span>}
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </header>
      )}

      {error && <p className="bds-image-tool__message is-error" role="alert">{error}</p>}
      {feedback && <p className="bds-image-tool__message is-success" role="status">{feedback}</p>}

      {upload}
      <div className="bds-image-tool__workspace">
        <ToolSection title="Ajustes" hideHeader={hideSectionHeaders} className="bds-image-tool__settings">{settings}</ToolSection>
        <ToolSection title="Preview" hideHeader={hideSectionHeaders} className="bds-image-tool__preview">{preview}</ToolSection>
      </div>
      <ToolSection title={exportTitle} hideHeader={hideSectionHeaders} className="bds-image-tool__export">{exportPanel}</ToolSection>
    </div>
  )
}
