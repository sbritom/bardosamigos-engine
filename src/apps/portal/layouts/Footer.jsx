import { Beer } from "lucide-react";
import Container from "../../../shared/layout/Container";

export default function Footer() {
  return (
    <footer
      className="border-t border-[rgba(212,175,55,.14)] bg-[rgba(8,8,8,.92)] backdrop-blur-xl"
      data-designer-id="footer"
      data-designer-label="Footer"
    >
      <Container className="py-5">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--bds-color-text-secondary)] md:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[rgba(212,175,55,.20)] bg-[rgba(212,175,55,.08)]">
              <Beer size={20} className="text-[#D4AF37]" />
            </span>
            <strong className="text-[var(--bds-color-text)]">
              BAR DOS <span className="text-[#D4AF37]">AMIGOS</span>
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
