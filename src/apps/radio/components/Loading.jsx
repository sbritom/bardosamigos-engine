import { memo } from "react";

function Loading({ label = "Carregando Radio Bar dos Amigos" }) {
  return (
    <div className="bar-radio-loading" role="status" aria-live="polite">
      <span />
      {label}
    </div>
  );
}

export default memo(Loading);
