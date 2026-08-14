import { Beer } from "lucide-react";
import Container from "../../../shared/layout/Container";

export default function Footer() {
  return (
    <footer
      className="border-t border-[rgba(190,216,240,.12)] bg-[rgba(13,32,53,.88)] backdrop-blur-xl"
      data-designer-id="footer"
      data-designer-label="Footer"
    >
      <Container className="py-5">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--bds-color-text-secondary)] md:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[rgba(190,216,240,.14)] bg-[rgba(75,134,244,.10)]">
              <Beer size={20} className="text-[#8BB5FF]" />
            </span>
            <strong className="text-[var(--bds-color-text)]">
              BAR DOS <span className="text-[#79A9FF]">AMIGOS</span>
            </strong>
          </div>

          <div className="text-center text-[var(--bds-color-text-muted)]">
            © 2016 - 2026 Bar dos Amigos. Todos os direitos reservados.
          </div>

          <div className="flex gap-4 text-[var(--bds-color-text-secondary)]">
            <span>Sobre</span>
            <span>Termos</span>
            <span>Contato</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
