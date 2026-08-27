import PortalCard from "../cards/PortalCard";

export default function PluginPage({ icon, title, description }) {
  return (
    <div className="space-y-4">
      <PortalCard>
        <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">{icon}</div>

          <h1 className="text-4xl font-black text-[var(--bds-color-primary-hover)]">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-[var(--bds-color-text-secondary)]">
            {description}
          </p>

          <div className="mt-6 rounded-full border border-[var(--bds-color-border)] px-5 py-2 text-sm font-bold text-[var(--bds-color-text-secondary)]">
            Plugin preparado para implementação
          </div>
        </div>
      </PortalCard>
    </div>
  );
}
