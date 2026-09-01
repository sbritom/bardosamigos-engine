import Container from "../../../shared/layout/Container";

const IMORTAL_RADIO_PLAYER_URL =
  "https://player.svrdedicado.org/player-barra/7956/071426";

export default function RadioBar() {
  return (
    <div className="bds-radio-strip">
      <Container>
        <div
          className="bds-mxcast-player imortal-radio-player"
          style={{
            height: '45px',
            minHeight: '45px',
            maxHeight: '45px',
            overflow: 'hidden',
            paddingBlock: 0,
          }}
        >
          <iframe
            src={IMORTAL_RADIO_PLAYER_URL}
            title="Rádio IMORTAL0800"
            className="bds-mxcast-player__iframe imortal-radio-player__iframe"
            allow="autoplay"
            loading="eager"
            frameBorder="0"
            style={{
              display: 'block',
              width: '100%',
              height: '31px',
              minHeight: '31px',
              maxHeight: '31px',
              border: 0,
              borderRadius: 0,
            }}
          />
        </div>
      </Container>
    </div>
  );
}
