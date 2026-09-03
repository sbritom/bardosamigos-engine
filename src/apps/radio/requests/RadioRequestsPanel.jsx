import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, History, Music2, RadioTower, RefreshCw, ShieldAlert } from "lucide-react";

import {
  getRadioLocutorStatus,
  getRadioRequestsAdminAccess,
  listRadioMusicRequests,
  updateRadioLocutorStatus,
  updateRadioMusicRequest,
} from "./radioRequestsApi";
import RadioRequestCard from "./RadioRequestCard";

const POLLING_INTERVAL = 10000;

function getHandledBy(user) {
  return user?.app_metadata?.username
    || user?.user_metadata?.username
    || user?.user_metadata?.name
    || user?.email
    || user?.id
    || "locutor";
}

export default function RadioRequestsPanel({ access: providedAccess } = {}) {
  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const [access, setAccess] = useState({ loading: true, allowed: false, reason: "" });
  const [requests, setRequests] = useState([]);
  const [locutorStatus, setLocutorStatus] = useState({ isLive: false, locutorName: "", updatedAt: null });
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [newPendingIds, setNewPendingIds] = useState(new Set());

  const effectiveAccess = providedAccess ? { loading: false, ...providedAccess } : access;

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );

  const handledCount = useMemo(
    () => requests.filter((request) => request.status === "read").length,
    [requests],
  );

  const visibleRequests = useMemo(
    () => requests.filter((request) => request.status === activeTab),
    [activeTab, requests],
  );

  const refresh = useCallback(async () => {
    try {
      const [requestData, statusData] = await Promise.all([
        listRadioMusicRequests(),
        getRadioLocutorStatus(),
      ]);

      const incomingIds = new Set(requestData.map((request) => request.id));
      const newIds = requestData
        .filter((request) => request.status === "pending" && !knownIdsRef.current.has(request.id))
        .map((request) => request.id);

      if (initializedRef.current && newIds.length) {
        setNewPendingIds(new Set(newIds));
      }

      knownIdsRef.current = incomingIds;
      initializedRef.current = true;
      setRequests(requestData);
      setLocutorStatus({
        isLive: Boolean(statusData?.isLive),
        locutorName: statusData?.locutorName || "",
        updatedAt: statusData?.updatedAt || null,
      });
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível carregar o painel do locutor.");
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
      setError(updateError.message || "Não foi possível atualizar o pedido.");
    } finally {
      setBusyId("");
    }
  }, [effectiveAccess.user]);

  const handleToggleLive = useCallback(async () => {
    try {
      setStatusBusy(true);
      const next = await updateRadioLocutorStatus(!locutorStatus.isLive);
      setLocutorStatus({
        isLive: Boolean(next?.isLive),
        locutorName: next?.locutorName || "",
        updatedAt: next?.updatedAt || null,
      });
      setError("");
    } catch (statusError) {
      setError(statusError.message || "Não foi possível alterar o status da rádio.");
    } finally {
      setStatusBusy(false);
    }
  }, [locutorStatus.isLive]);

  if (effectiveAccess.loading || loading) {
    return (
      <section className="radio-admin-panel radio-requests-panel">
        <div className="radio-admin-panel-title">
          <Music2 size={18} />
          <h2>Painel do locutor</h2>
        </div>
        <p>Carregando...</p>
      </section>
    );
  }

  if (!effectiveAccess.allowed) {
    return (
      <section className="radio-admin-panel radio-requests-panel">
        <div className="radio-admin-panel-title">
          <ShieldAlert size={18} />
          <h2>Painel do locutor</h2>
        </div>
        <p>{effectiveAccess.reason || "Entre com uma conta autorizada para acessar este painel."}</p>
      </section>
    );
  }

  return (
    <section className="radio-admin-panel radio-requests-panel">
      <div className="radio-locutor-toolbar">
        <div className={locutorStatus.isLive ? "radio-locutor-live is-live" : "radio-locutor-live"}>
          <span className="radio-locutor-live__icon">
            <RadioTower size={18} />
          </span>
          <div>
            <small>Status da rádio</small>
            <strong>{locutorStatus.isLive ? "NO AR" : "FORA DO AR"}</strong>
            {locutorStatus.isLive && locutorStatus.locutorName ? (
              <span>{locutorStatus.locutorName}</span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className={locutorStatus.isLive ? "radio-locutor-status-button is-live" : "radio-locutor-status-button"}
          onClick={handleToggleLive}
          disabled={statusBusy}
        >
          <RadioTower size={16} />
          {statusBusy
            ? "Atualizando..."
            : locutorStatus.isLive
              ? "Encerrar transmissão"
              : "Entrar no ar"}
        </button>
      </div>

      <div className="radio-requests-panel__title">
        <div className="radio-admin-panel-title">
          <Music2 size={18} />
          <h2>Pedidos musicais</h2>
        </div>

        <button type="button" className="radio-requests-refresh" onClick={refresh}>
          <RefreshCw size={15} />
          Atualizar
        </button>
      </div>

      <div className="radio-request-tabs" role="tablist" aria-label="Pedidos musicais">
        <button
          type="button"
          className={activeTab === "pending" ? "is-active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          <BellRing size={15} />
          Pendentes
          <span>{pendingCount}</span>
        </button>

        <button
          type="button"
          className={activeTab === "read" ? "is-active" : ""}
          onClick={() => setActiveTab("read")}
        >
          <History size={15} />
          Histórico
          <span>{handledCount}</span>
        </button>
      </div>

      {error && <p className="radio-requests-error">{error}</p>}

      <div className="radio-requests-list">
        {visibleRequests.length ? visibleRequests.map((request) => (
          <div className={newPendingIds.has(request.id) ? "radio-request-highlight" : ""} key={request.id}>
            <RadioRequestCard
              request={request}
              busy={busyId === request.id}
              onMarkRead={handleMarkRead}
            />
          </div>
        )) : (
          <div className="radio-requests-empty">
            <Music2 size={20} />
            <p>
              {activeTab === "pending"
                ? "Nenhum pedido pendente."
                : "Nenhum pedido atendido no histórico."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
