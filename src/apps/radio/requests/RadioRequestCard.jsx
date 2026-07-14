import { memo } from "react";
import { Check, CheckCircle2, Clock3, Music2, X } from "lucide-react";

const STATUS_LABELS = {
  pending: "Novo",
  approved: "Aceito",
  rejected: "Recusado",
  played: "Tocada",
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

function RadioRequestCard({ request, busy, onUpdate }) {
  const status = request.status || "pending";

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

      <div className="radio-request-card__actions">
        <button type="button" disabled={busy || status === "approved" || status === "played"} onClick={() => onUpdate(request, "approved")}>
          <Check size={15} />
          Aceitar
        </button>
        <button type="button" disabled={busy || status === "rejected" || status === "played"} onClick={() => onUpdate(request, "rejected")}>
          <X size={15} />
          Recusar
        </button>
        <button type="button" disabled={busy || status === "played"} onClick={() => onUpdate(request, "played")}>
          <CheckCircle2 size={15} />
          Tocada
        </button>
      </div>
    </article>
  );
}

export default memo(RadioRequestCard);
