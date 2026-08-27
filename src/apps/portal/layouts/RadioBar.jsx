import Container from "../../../shared/layout/Container";

const MXCAST_PLAYER_URL =
  "https://player.mxcast.com.br/mx-player/7186/D4AF37";

export default function RadioBar() {
  return (
    <div className="bds-radio-strip">
      <Container>
        <div
          className="bds-mxcast-player"
          style={{
            height: '30px',
            overflow: 'hidden',
            paddingBlock: 0,
          }}
        >
          <iframe
            src={MXCAST_PLAYER_URL}
            title="Rádio Bar dos Amigos"
            className="bds-mxcast-player__iframe"
            allow="autoplay"
            loading="eager"
            style={{
              display: 'block',
              width: '100%',
              height: '78px',
              minHeight: 0,
              border: 0,
              borderRadius: 0,
              transform: 'translateY(0)',
            }}
          />
        </div>
      </Container>
    </div>
  );
}
