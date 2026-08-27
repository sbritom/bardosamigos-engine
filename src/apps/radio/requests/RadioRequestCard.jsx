import { memo } from "react";
import { Check, Clock3, Music2 } from "lucide-react";

const STATUS_LABELS = {
  pending: "NOVO",
  read: "LIDO",
};

function formatRequestDate(value) {
  if (!value) return "Horario indisponivel";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RadioRequestCard({ request, busy, onMarkRead }) {
  const status = request.status || "pending";
  const isPending = status === "pending";

  return (
    <article className={`radio-request-card radio-request-card--${status}`}>
      <div className="radio-request-card__main">
        <span className={`radio-request-card__status is-${status}`}>
          {STATUS_LABELS[status] || status}
        </span>
        <strong>
          <Music2 size={16} />
          {request.songAndArtist || "Pedido sem musica"}
        </strong>
        {request.message && <p>{request.message}</p>}
        <small>
          <Clock3 size={14} />
          {formatRequestDate(request.createdAt)}
        </small>
        {request.handledBy && <small>Locutor: {request.handledBy}</small>}
      </div>

      {isPending && (
        <div className="radio-request-card__actions">
          <button type="button" disabled={busy} onClick={() => onMarkRead(request)}>
            <Check size={15} />
            MARCAR COMO LIDO
          </button>
        </div>
      )}
    </article>
  );
}

export default memo(RadioRequestCard);
