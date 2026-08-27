import { memo } from "react";
import { Radio, Wifi, WifiOff } from "lucide-react";

function RadioHeader({ online, updatedAt }) {
  const StatusIcon = online ? Wifi : WifiOff;

  return (
    <header className="bar-radio-header">
      <div className="bar-radio-brand">
        <div className="bar-radio-logo" aria-hidden="true">
          <Radio size={28} />
        </div>
        <div>
          <p>Radio oficial</p>
          <h1>Radio Bar dos Amigos</h1>
        </div>
      </div>

      <div className={`bar-radio-live ${online ? "is-online" : "is-offline"}`}>
        <StatusIcon size={18} />
        <span>{online ? "ONLINE" : "OFFLINE"}</span>
        {updatedAt && <small>Atualizado {new Date(updatedAt).toLocaleTimeString("pt-BR")}</small>}
      </div>
    </header>
  );
}

export default memo(RadioHeader);
