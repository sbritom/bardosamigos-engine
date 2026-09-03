import { memo } from "react";

function Loading({ label = "Carregando Rádio IMORTAL0800" }) {
  return (
    <div className="bar-radio-loading" role="status" aria-live="polite">
      <span />
      {label}
    </div>
  );
}

export default memo(Loading);
