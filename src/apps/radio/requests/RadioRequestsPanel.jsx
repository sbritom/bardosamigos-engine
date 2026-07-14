import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Music2, ShieldAlert } from "lucide-react";

import { getRadioRequestsAdminAccess, listRadioMusicRequests, updateRadioMusicRequest } from "./radioRequestsApi";
import RadioRequestCard from "./RadioRequestCard";

const POLLING_INTERVAL = 10000;

function getHandledBy(user) {
  return user?.user_metadata?.name || user?.email || user?.id || "locutor";
}

export default function RadioRequestsPanel({ access: providedAccess } = {}) {
  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const [access, setAccess] = useState({ loading: true, allowed: false, reason: "" });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [newPendingIds, setNewPendingIds] = useState(new Set());

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );
  const effectiveAccess = providedAccess ? { loading: false, ...providedAccess } : access;

  const refresh = useCallback(async () => {
    try {
      const data = await listRadioMusicRequests();
      const incomingIds = new Set(data.map((request) => request.id));
      const newIds = data
        .filter((request) => request.status === "pending" && !knownIdsRef.current.has(request.id))
        .map((request) => request.id);

      if (initializedRef.current && newIds.length) {
        setNewPendingIds(new Set(newIds));
      }

      knownIdsRef.current = incomingIds;
      initializedRef.current = true;
      setRequests(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (providedAccess) return undefined;

    let active = true;
    getRadioRequestsAdminAccess().then((result) => {
      if (active) setAccess({ loading: false, ...result });
    });
    return () => {
      active = false;
    };
  }, [providedAccess]);

  useEffect(() => {
    if (effectiveAccess.loading || !effectiveAccess.allowed) {
      const loadingTimer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(loadingTimer);
    }

    const refreshTimer = window.setTimeout(refresh, 0);
    const intervalId = window.setInterval(refresh, POLLING_INTERVAL);
    return () => {
      window.clearTimeout(refreshTimer);
      window.clearInterval(intervalId);
    };
  }, [effectiveAccess.allowed, effectiveAccess.loading, refresh]);

  const handleMarkRead = useCallback(async (request) => {
    try {
      setBusyId(request.id);
      const updated = await updateRadioMusicRequest({
        id: request.id,
        status: "read",
        handledBy: getHandledBy(effectiveAccess.user),
      });
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNewPendingIds((current) => {
        const next = new Set(current);
        next.delete(request.id);
        return next;
      });
      setError("");
    } catch (updateError) {
      setError(updateError.message || "Nao foi possivel atualizar o pedido.");
    } finally {
      setBusyId("");
    }
  }, [effectiveAccess.user]);

  if (effectiveAccess.loading || loading) {
    return (
      <section className="radio-admin-panel radio-requests-panel">
        <div className="radio-admin-panel-title">
          <Music2 size={18} />
          <h2>Pedidos Musicais</h2>
        </div>
        <p>Carregando pedidos...</p>
      </section>
    );
  }

  if (!effectiveAccess.allowed) {
    return (
      <section className="radio-admin-panel radio-requests-panel">
        <div className="radio-admin-panel-title">
          <ShieldAlert size={18} />
          <h2>Pedidos Musicais</h2>
        </div>
        <p>{effectiveAccess.reason || "Entre com uma conta administradora para ver os pedidos."}</p>
      </section>
    );
  }

  return (
    <section className="radio-admin-panel radio-requests-panel">
      <div className="radio-admin-panel-title radio-requests-panel__title">
        <div>
          <Music2 size={18} />
          <h2>Pedidos Musicais</h2>
        </div>
        <span className={pendingCount ? "radio-requests-counter is-live" : "radio-requests-counter"}>
          <BellRing size={15} />
          {pendingCount ? `${pendingCount} NOVO${pendingCount === 1 ? "" : "S"}` : "Nenhum pedido novo"}
        </span>
      </div>

      {error && <p className="radio-requests-error">{error}</p>}

      <div className="radio-requests-list">
        {requests.length ? requests.map((request) => (
          <div className={newPendingIds.has(request.id) ? "radio-request-highlight" : ""} key={request.id}>
            <RadioRequestCard request={request} busy={busyId === request.id} onMarkRead={handleMarkRead} />
          </div>
        )) : (
          <p>Nenhum pedido musical registrado ainda.</p>
        )}
      </div>
    </section>
  );
}
