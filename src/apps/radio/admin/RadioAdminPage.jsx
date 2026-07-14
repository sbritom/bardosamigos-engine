import { useCallback, useEffect, useMemo, useState } from "react";

import Loading from "../components/Loading";
import AutoDJCard from "./components/AutoDJCard";
import FFmpegCard from "./components/FFmpegCard";
import HealthCard from "./components/HealthCard";
import HistoryCard from "./components/HistoryCard";
import IcecastCard from "./components/IcecastCard";
import LibraryCard from "./components/LibraryCard";
import ListenersCard from "./components/ListenersCard";
import LogsCard from "./components/LogsCard";
import PlayerCard from "./components/PlayerCard";
import QueueCard from "./components/QueueCard";
import SchedulerCard from "./components/SchedulerCard";
import SettingsCard from "./components/SettingsCard";
import StatusCard from "./components/StatusCard";
import StorageCard from "./components/StorageCard";
import { loadAdminDashboard, POLLING_INTERVAL } from "./adminApi";
import RadioRequestsPanel from "../requests/RadioRequestsPanel";
import "./radioAdmin.css";

const EMPTY_DATA = {
  dashboard: null,
  storage: null,
  system: null,
  config: null,
  logs: null,
  error: false,
};

export default function RadioAdminPage() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (signal) => {
    try {
      setData(await loadAdminDashboard({ signal }));
    } catch {
      setData((current) => ({ ...current, error: true }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const refreshTimer = window.setTimeout(() => refresh(controller.signal), 0);
    const intervalId = window.setInterval(() => refresh(controller.signal), POLLING_INTERVAL);

    return () => {
      controller.abort();
      window.clearTimeout(refreshTimer);
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const dashboard = data.dashboard || {};
  const system = data.system || dashboard.system;
  const storage = data.storage || dashboard.storage;
  const config = data.config || dashboard.config;
  const logs = data.logs || {};

  const subtitle = useMemo(() => {
    if (data.error) return "API administrativa indisponivel. Tentando reconectar.";
    return `Atualizacao automatica a cada ${Math.round(POLLING_INTERVAL / 1000)}s`;
  }, [data.error]);

  return (
    <main className="radio-admin-page">
      <header className="radio-admin-header">
        <span>Radio Control Center</span>
        <h1>Admin Dashboard</h1>
        <p>{subtitle}</p>
      </header>

      {loading ? (
        <Loading label="Carregando centro de controle" />
      ) : (
        <div className="radio-admin-grid">
          <RadioRequestsPanel />
          <StatusCard dashboard={dashboard} system={system} />
          <ListenersCard player={dashboard.player} icecast={dashboard.icecast} />
          <PlayerCard player={dashboard.player} />
          <LibraryCard library={dashboard.library} />
          <QueueCard queue={dashboard.queue} />
          <HistoryCard history={dashboard.history} />
          <IcecastCard icecast={dashboard.icecast} />
          <FFmpegCard ffmpeg={dashboard.ffmpeg} />
          <SchedulerCard scheduler={dashboard.scheduler} />
          <AutoDJCard autodj={dashboard.autodj} />
          <StorageCard storage={storage} />
          <SettingsCard config={config} />
          <HealthCard health={dashboard.health} />
          <LogsCard logs={logs} />
        </div>
      )}
    </main>
  );
}
