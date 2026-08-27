import { memo } from "react";
import { Headphones } from "lucide-react";

function ListenersCard({ player, icecast }) {
  const listeners = player?.listeners || icecast?.listeners || icecast?.lastDebug?.listeners || 0;

  return (
    <section className="radio-admin-panel radio-admin-listeners">
      <Headphones size={24} />
      <span>Ouvintes</span>
      <strong>{listeners}</strong>
    </section>
  );
}

export default memo(ListenersCard);
