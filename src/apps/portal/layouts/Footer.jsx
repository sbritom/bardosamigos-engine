import { Beer } from "lucide-react";
import Container from "../../../shared/layout/Container";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--bds-color-border)] bg-[var(--bds-color-background)]" data-designer-id="footer" data-designer-label="Footer">
      <Container className="py-5">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--bds-color-text-secondary)] md:flex-row">
          <div className="flex items-center gap-3">
            <Beer size={24} className="text-[var(--bds-color-primary-hover)]" />
            <strong className="text-[var(--bds-color-text)]">
              BAR DOS <span className="text-[var(--bds-color-primary-hover)]">AMIGOS</span>
            </strong>
          </div>

          <div>© 2016 - 2026 Bar dos Amigos. Todos os direitos reservados.</div>

          <div className="flex gap-4">
            <span>Sobre</span>
            <span>Termos</span>
            <span>Contato</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
