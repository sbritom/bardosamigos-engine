import Container from "../../../shared/layout/Container";

const IMORTAL_RADIO_PLAYER_URL =
  "https://player.svrdedicado.org/player-topo-moderno2/7956/030611";

export default function RadioBar() {
  return (
    <div className="bds-radio-strip">
      <Container>
        <div
          className="bds-mxcast-player"
          style={{
            height: '80px',
            overflow: 'hidden',
            paddingBlock: 0,
          }}
        >
          <iframe
            src={IMORTAL_RADIO_PLAYER_URL}
            title="Rádio IMORTAL0800"
            className="bds-mxcast-player__iframe"
            allow="autoplay"
            loading="eager"
            frameBorder="0"
            style={{
              display: 'block',
              width: '100%',
              height: '80px',
              minHeight: '80px',
              border: 0,
              borderRadius: 0,
            }}
          />
        </div>
      </Container>
    </div>
  );
}
