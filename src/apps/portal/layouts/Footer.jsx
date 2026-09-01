import { Gamepad2, Music2, RadioTower, Trophy, Tv, Users } from "lucide-react";
import Container from "../../../shared/layout/Container";
import "../../../design-system/styles/imortal0800-footer.css";

const FOOTER_LINKS = [
  { label: "TV", href: "/tv", icon: Tv },
  { label: "Futebol", href: "/football", icon: Trophy },
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Música", href: "/radio", icon: Music2 },
  { label: "Comunidade", href: "/community", icon: Users },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="imortal-footer"
      data-designer-id="footer"
      data-designer-label="Footer"
    >
      <Container className="imortal-footer__container">
        <div className="imortal-footer__main">
          <a className="imortal-footer__brand" href="/" aria-label="IMORTAL0800 - Início">
            <span className="imortal-footer__brand-icon" aria-hidden="true">
              <RadioTower size={19} />
            </span>
            <span className="imortal-footer__brand-copy">
              <strong>IMORTAL<span>0800</span></strong>
              <small>TV, futebol, games, música e comunidade.</small>
            </span>
          </a>

          <nav className="imortal-footer__nav" aria-label="Navegação do rodapé">
            {FOOTER_LINKS.map(({ label, href, icon: Icon }) => (
              <a key={href} href={href}>
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="imortal-footer__bottom">
          <span>© {year} IMORTAL0800. Todos os direitos reservados.</span>
          <span className="imortal-footer__status">
            <i aria-hidden="true" />
            Portal online
          </span>
        </div>
      </Container>
    </footer>
  );
}
