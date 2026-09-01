import Container from "../../../shared/layout/Container";

const IMORTAL_RADIO_PLAYER_URL =
  "https://player.svrdedicado.org/player-topo-moderno1/7956/060A11";

export default function RadioBar() {
  return (
    <div className="bds-radio-strip">
      <Container className="imortal-radio-strip__container">
        <div className="imortal-radio-player">
          <iframe
            src={IMORTAL_RADIO_PLAYER_URL}
            title="Rádio IMORTAL0800"
            className="imortal-radio-player__iframe"
            frameBorder="0"
            width="100%"
            height="80"
            allow="autoplay"
            loading="eager"
          />
        </div>
      </Container>
    </div>
  );
}
