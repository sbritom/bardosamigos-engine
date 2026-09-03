import { memo } from "react";
import { ExternalLink, Radio } from "lucide-react";
import { coverUrl } from "./xatApi";

function MiniPlayerWidget({ track, status, stream }) {
  const normalized = String(status?.status || status || "").toLowerCase();
  const online = normalized === "playing" || normalized === "online";
  const listenUrl = stream?.url || "#";

  return (
    <section className="bar-xat-widget">
      <div className="bar-xat-logo"><Radio size={22} /></div>
      <img className="bar-xat-cover" src={coverUrl(track, 128)} alt="" />
      <div className="bar-xat-main">
        <span className={`bar-xat-status ${online ? "is-online" : "is-offline"}`}>{online ? "ONLINE" : "OFFLINE"}</span>
        <strong>{track?.title || "Rádio IMORTAL0800"}</strong>
        <small>{track?.artist || "Som que não para."}</small>
      </div>
      <a className="bar-xat-listen" href={listenUrl} target="_blank" rel="noreferrer">
        <ExternalLink size={15} />
        Ouvir Rádio
      </a>
    </section>
  );
}

export default memo(MiniPlayerWidget);
