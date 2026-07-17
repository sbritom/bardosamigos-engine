import Container from "../../../shared/layout/Container";

const MXCAST_PLAYER_URL =
  "https://player.mxcast.com.br/mx-player/7186/0B3D91";

export default function RadioBar() {
  return (
    <div className="bds-radio-strip">
      <Container>
        <div className="bds-mxcast-player">
          <iframe
            src={MXCAST_PLAYER_URL}
            title="Rádio Bar dos Amigos"
            className="bds-mxcast-player__iframe"
            allow="autoplay"
            loading="eager"
          />
        </div>
      </Container>
    </div>
  );
}
