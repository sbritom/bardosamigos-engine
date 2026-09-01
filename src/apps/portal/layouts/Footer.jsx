import Container from "../../../shared/layout/Container";
import "../../../design-system/styles/imortal0800-footer.css";

export default function Footer() {
  return (
    <footer
      className="imortal-footer"
      data-designer-id="footer"
      data-designer-label="Footer"
    >
      <Container className="imortal-footer__container">
        <div className="imortal-footer__row">
          <a className="imortal-footer__brand" href="/" aria-label="IMORTAL0800 - Início">
            <span className="imortal-footer__infinity" aria-hidden="true">∞</span>
            <strong>IMORTAL<span>0800</span></strong>
          </a>

          <span className="imortal-footer__copyright">
            © 2026 IMORTAL0800. Todos os direitos reservados.
          </span>
        </div>
      </Container>
    </footer>
  );
}
