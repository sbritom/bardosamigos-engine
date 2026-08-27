import { memo } from "react";

import PortalPlayer from "./PortalPlayer";

function FullPlayer(props) {
  return (
    <section className="bar-radio-full-player" aria-label="Player principal da radio">
      <PortalPlayer {...props} />
      {!props.streamAvailable && (
        <p className="bar-radio-inline-warning">
          Stream ainda nao configurado. A interface continua disponivel em modo monitoramento.
        </p>
      )}
    </section>
  );
}

export default memo(FullPlayer);
